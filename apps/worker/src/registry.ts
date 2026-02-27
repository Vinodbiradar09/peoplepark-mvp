import type { Consumer } from "@repo/kafka";
import { workerMessages } from "./messages/wm.js";
import { workerRooms } from "./rooms/wr.js";

type ConsumerEntry = {
  name: string;
  start: () => Promise<Consumer>;
};

// add the workers list and there function references 
export const consumerRegistry: ConsumerEntry[] = [
  {
    name: "chat-messages",
    start: workerMessages,
  },
  {
    name: "room-events",
    start : workerRooms
  }
];
