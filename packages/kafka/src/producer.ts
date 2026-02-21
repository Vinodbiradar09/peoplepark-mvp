import { kafka } from "./client";
import type { Producer } from "kafkajs";

const producer: Producer = kafka.producer({
  allowAutoTopicCreation: false,
  idempotent: true,
  maxInFlightRequests: 5,
  retry: {
    retries: 5,
  },
});

let connectPromise: Promise<void> | null = null;

// don't use booleans race conditions can kill you 

export async function getProducer(): Promise<Producer> {
    // request 1 enters , connects the producer holds the pending promise in the connectPromise 
    // request 2 enters , connectPromise is not null so it don't call the producer again 
    // this ensures the req2 , req3 , req4, req5 waits on the same promises 
  if (!connectPromise) {
    connectPromise = producer.connect();
  }
  await connectPromise;
  return producer;
}

export async function disconnectProducer(): Promise<void> {
  if (connectPromise) {
    await producer.disconnect();
    connectPromise = null;
  }
}
