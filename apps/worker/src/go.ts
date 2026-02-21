import { consumerRegistry } from "./registry";
import type { Consumer } from "@repo/kafka";

const runningWorkers = new Map<string, Consumer>();

export async function startWorkers() {
  for (const entry of consumerRegistry) {
    try {
      console.log(`starting worker ${entry.name}`);
      const worker = await entry.start();
      runningWorkers.set(entry.name, worker);
      console.log(`worker started ${entry.name}`);
    } catch (error) {
      console.error(`failed to start worker : ${entry.name}`, error);
    }
  }
}

export async function shutdownWorkers() {
  for (const [name, worker] of runningWorkers) {
    try {
      console.log(`Stopping consumer: ${name}`);
      await worker.disconnect();
    } catch (err) {
      console.error(`Error stopping consumer: ${name}`, err);
    }
  }
}
