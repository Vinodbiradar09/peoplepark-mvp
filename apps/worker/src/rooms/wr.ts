import { kafka } from "@repo/kafka";
import { pipeline } from "@repo/redis";
import { getRoomCells } from "@repo/zod";

const CELL_KEY = (cell: string) => `geo:cell:${cell}`;
const CELL_TTL = 60 * 60 * 24;

interface RoomPayload {
  id: string;
  name: string;
  img: string | null;
  lat: number;
  lng: number;
  memberCount: number;
  maxMembers: number;
  createdAt: string;
  expiresAt: string | null;
  isDeleted: boolean;
  isBlacklisted: boolean;
}
async function indexRoomInCells(room: RoomPayload) {
  const cells = getRoomCells(room.lat, room.lng);
  const pip = pipeline.pipeline();

  for (const cell of cells) {
    pip.hset(CELL_KEY(cell), room.id, JSON.stringify(room));
    pip.expire(CELL_KEY(cell), CELL_TTL);
  }
  await pip.exec();
}

async function removeRoomFromCells(roomId: string, lat: number, lng: number) {
  const cells = getRoomCells(lat, lng);
  const pip = pipeline.pipeline();

  for (const cell of cells) {
    pip.hdel(CELL_KEY(cell), roomId);
  }

  await pip.exec();
}

export async function workerRooms() {
  const consumer = kafka.consumer({ groupId: "room-indexer" });
  await consumer.connect();
  await consumer.subscribe({
    topics: [
      "room-created",
      "room-updated",
      "room-deleted",
      "room-membercount",
    ],
    fromBeginning: false,
  });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      if (!message.value) return;
      const payload = JSON.parse(message.value.toString()) as RoomPayload;

      switch (topic) {
        case "room-created":
          if (payload.isBlacklisted || payload.isDeleted) return;
          await indexRoomInCells(payload);
          break;

        case "room-updated":
          if (payload.isBlacklisted || payload.isDeleted) {
            await removeRoomFromCells(payload.id, payload.lat, payload.lng);
            return;
          }
          await indexRoomInCells(payload);
          break;

        case "room-deleted":
          await removeRoomFromCells(payload.id, payload.lat, payload.lng);
          break;

        case "room-membercount":
          const cells = getRoomCells(payload.lat, payload.lng);
          const pip = pipeline.pipeline();
          for (const cell of cells) {
            const key = CELL_KEY(cell);
            // Lua script: only update if room exists in this cell
            pip.eval(
              `
              local val = redis.call('HGET', KEYS[1], ARGV[1])
              if val then
                local room = cjson.decode(val)
                room.memberCount = tonumber(ARGV[2])
                redis.call('HSET', KEYS[1], ARGV[1], cjson.encode(room))
              end
              return 1
              `,
              1,
              key,
              payload.id,
              String(payload.memberCount),
            );
          }
          await pip.exec();
          break;
      }
    },
  });
  return consumer;
}

// export async function workerForRoomCreation() {
//   const consumer = kafka.consumer({ groupId: "room-creator" });
//   await consumer.connect();
//   await consumer.subscribe({
//     topic: "room-created",
//     fromBeginning: false,
//   });
//   await consumer.run({
//     eachMessage: async ({ message, heartbeat }) => {
//       if (!message.value) return;
//       const payload = JSON.parse(message.value.toString()) as RoomPayload;
//       if (payload.isBlacklisted || payload.isDeleted) return;
//       await indexRoomInCells(payload);
//     },
//   });
//   return consumer;
// }
