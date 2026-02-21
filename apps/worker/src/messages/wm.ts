import { prisma } from "@repo/db";
import { kafka } from "@repo/kafka";
import type { Consumer } from "@repo/kafka";

interface CustomMessages {
  roomId: string;
  content: string;
  senderId: string;
  createdAt: string;
}

export async function workerMessages(): Promise<Consumer> {
  const consumer = kafka.consumer({
    groupId: "chat-message-writer",
    maxWaitTimeInMs: 200,
    minBytes: 64 * 1024,
    maxBytes: 10 * 1024 * 1024,
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
    fromBeginning: true,
  });
  await consumer.run({
    eachBatchAutoResolve: false,
    eachBatch: async ({
      batch,
      resolveOffset,
      heartbeat,
      commitOffsetsIfNecessary,
    }) => {
      const messages: CustomMessages[] = batch.messages
        .map((msg) => {
          const strMsg = msg.value?.toString();
          return strMsg ? JSON.parse(strMsg) : null;
        })
        .filter(Boolean);

      console.log("messagess", messages);

      try {
        await prisma.messages.createMany({
          data: messages,
          skipDuplicates: true,
        });

        for (const message of batch.messages) {
          resolveOffset(message.offset);
        }
        await commitOffsetsIfNecessary();
      } catch (error) {
        // todo handle the dead letter queue for continous 5 sets of batch error 
        console.log("critical batch insert fail error for db ", error);
        throw error;
      } finally {
        await heartbeat();
      }
    },
  });
  return consumer;
}
