import { getProducer } from "../producer";

export async function roomEvents(
  topic: string,
  payload: Record<string, unknown>,
) {
  const producer = await getProducer();
  await producer.send({
    topic,
    messages: [
      {
        key: String(payload.roomId ?? payload.id),
        value: JSON.stringify(payload),
      },
    ],
  });
}

