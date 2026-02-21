import { prisma } from "@repo/db";
import { kafka } from "@repo/kafka";
import type { Consumer } from "@repo/kafka";

export async function workerMessages() : Promise<Consumer> {
  const consumer = kafka.consumer({ groupId: "chat-message-writer" });
  await consumer.connect();

  await consumer.subscribe({
    topic: "chat-messages",
    fromBeginning: true,
  });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;
      const payload = JSON.parse(message.value.toString());
      await prisma.messages.create({
        data: {
          roomId: payload.roomId,
          senderId: payload.senderId,
          content: payload.content,
          //createdAt: payload.timestamp,
        },
      });
    },
  });
  return consumer;
}
