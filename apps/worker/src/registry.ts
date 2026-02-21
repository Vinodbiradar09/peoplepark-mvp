import type { Consumer } from "@repo/kafka";
import { workerMessages } from "./messages/wm.js";

type ConsumerEntry = {
  name: string;
  start: () => Promise<Consumer>;
};

export const consumerRegistry: ConsumerEntry[] = [
  {
    name: "chat-messages",
    start: workerMessages,
  },
];
