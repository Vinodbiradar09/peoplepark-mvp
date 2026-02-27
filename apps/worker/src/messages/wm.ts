import { MessageType, prisma } from "@repo/db";
import { kafka } from "@repo/kafka";
import type { Consumer } from "@repo/kafka";
import { cache } from "@repo/redis";

enum Type {
  TEXT,
  IMAGE,
  VIDEO,
  AUDIO,
}
interface CustomMessages {
  roomId: string;
  content: string;
  senderId: string;
  createdAt: string;
  offset: bigint;
  type: MessageType;
}
interface deleteMessages {
  mIds: string[];
  roomId: string;
  senderId: string;
}
// avoid each message consuming it overload the db in scale
export async function workerMessages(): Promise<Consumer> {
  const consumer = kafka.consumer({
    groupId: "chat-message-writer",
    maxWaitTimeInMs: 200, // waits for the 200ms
    minBytes: 64 * 1024, // it is the min bytes of kb
    maxBytes: 10 * 1024 * 1024, // it is the max bytes of the kb
  });
  // await consumer.connect();

  // await consumer.subscribe({
  //   topic: "chat-messages",
  //   fromBeginning: true,
  // });

  // await consumer.run({
  //   eachMessage: async ({ message }) => {
  //     if (!message.value) return;
  //     const payload = JSON.parse(message.value.toString());
  //     await prisma.messages.create({
  //       data: {
  //         roomId: payload.roomId,
  //         senderId: payload.senderId,
  //         content: payload.content,
  //         createdAt: new Date(payload.timestamp),
  //       },
  //     });
  //   },
  // });

  await consumer.connect();
  await consumer.subscribe({
    topics: ["chat-messages"],
    fromBeginning: false, // don't touch it , in prod at every restart we don't want to read all the messages
  });
  await consumer.run({
    eachBatchAutoResolve: false,
    eachBatch: async ({
      batch,
      resolveOffset,
      heartbeat,
      commitOffsetsIfNecessary,
    }) => {
      // map over the batch messages and create an array of objects
      const messages: CustomMessages[] = batch.messages
        .filter((msg) => msg.value)
        .map((msg) => {
          const jsonMsg = JSON.parse(msg.value!.toString());
          return {
            roomId: jsonMsg.roomId,
            content: jsonMsg.content,
            senderId: jsonMsg.senderId,
            createdAt: jsonMsg.createdAt,
            offset: BigInt(msg.offset),
            type: jsonMsg.type,
          };
        });

      console.log("messagess", messages);
      try {
        // bulk write the user messages
        await prisma.messages.createMany({
          data: messages,
          skipDuplicates: true,
        });
        // after db success resolve the offset for each message
        for (const message of batch.messages) {
          resolveOffset(message.offset);
        }
        await commitOffsetsIfNecessary();
        // unique roomIds
        const roomIds = new Set<string>();
        for (const msg of messages) {
          roomIds.add(msg.roomId);
        }
        // invalidate the cache for the new messages
        console.log("roomId", roomIds);
        const p = await Promise.all(
          [...roomIds].map((roomId) =>
            cache.del("roomMessages", [roomId, "latest", "50"]),
          ),
        );
      } catch (error) {
        // todo handle the dead letter queue for continous 5 sets of batch error
        console.log("critical batch insert fail error for db ", error);
        throw error;
      } finally {
        // make sure hearbeat
        await heartbeat();
      }
    },
  });
  return consumer;
}

export async function workerDeleteMessages(): Promise<Consumer> {
  const consumer = kafka.consumer({
    groupId: "delete-messagees",
    maxWaitTimeInMs: 200, // waits for the 200ms
    minBytes: 64 * 1024, // it is the min bytes of kb
    maxBytes: 10 * 1024 * 1024, // it is the max bytes of the kb
  });
  await consumer.connect();
  await consumer.subscribe({
    topics: ["delete-messages"],
    fromBeginning: false,
  });
  await consumer.run({
    eachBatchAutoResolve: false,
    eachBatch: async ({
      batch,
      resolveOffset,
      heartbeat,
      commitOffsetsIfNecessary,
    }) => {
      try {
        const messages: deleteMessages[] = batch.messages
          .filter((msg) => msg.value)
          .map((msg) => {
            const jsonMsg = JSON.parse(msg.value!.toString());
            return {
              mIds: jsonMsg.mIds,
              roomId: jsonMsg.roomId,
              senderId: jsonMsg.senderId,
            };
          });
        for (const message of messages) {
          await prisma.messages.updateMany({
            where: {
              id: { in: message.mIds },
              senderId: message.senderId,
              roomId: message.roomId,
            },
            data: {
              isDeleted: true,
            },
          });
        }
        await commitOffsetsIfNecessary();
      } catch (e) {
        console.log(e);
      } finally {
        await heartbeat();
      }
    },
  });
  return consumer;
}
