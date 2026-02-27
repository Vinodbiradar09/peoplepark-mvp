import { kafka } from "./client";
const admin = kafka.admin();

interface Topics {
  topic: string;
  numPartitions: number;
  replicationFactor: number;
}

const requiredTopics: Topics[] = [
  {
    topic: "chat-messages",
    numPartitions: 6,
    replicationFactor: 1,
  },
  {
    topic: "room-created",
    numPartitions: 6,
    replicationFactor: 1,
  },
  {
    topic: "room-updated",
    numPartitions: 6,
    replicationFactor: 1,
  },
  {
    topic: "room-deleted",
    numPartitions: 6,
    replicationFactor: 1,
  },
  {
    topic: "room-membercount",
    numPartitions: 6,
    replicationFactor: 1,
  },
];

export async function Admin() {
  await admin.connect();

  try {
    const existingTopics = await admin.listTopics();
    console.log("existing ", existingTopics);
    const topics = requiredTopics.filter(
      (t) => !existingTopics.includes(t.topic),
    );
    if (topics.length > 0) {
      await admin.createTopics({
        waitForLeaders: true,
        topics,
      });
      console.log(
        "kafka topics created",
        topics.map((t) => t.topic),
      );
    } else {
      console.log("topics exists already");
    }
  } catch (error) {
    console.log("error", error);
  } finally {
    await admin.disconnect();
  }
}
