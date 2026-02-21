import { getProducer } from "../producer";

export async function messageProduce(payload: any) {
  const producer = await getProducer();
  producer.send({
    topic: "chat-messages",
    acks: -1,
    messages: [
      {
        key: payload.roomId,
        value: JSON.stringify(payload),
      },
    ],
  });
}
