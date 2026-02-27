import { prisma } from "@repo/db";
import cron from "node-cron";
import { roomEvents } from "@repo/kafka";

export async function cronJobs() {
  cron.schedule("*/10 * * * *", async () => {
    try {
      const result = await prisma.$transaction(async (tx) => {
        const expiredRooms = await tx.room.findMany({
          where: { expiresAt: { lt: new Date() }, isDeleted: false },
          select: { id: true },
        });

        if (expiredRooms.length === 0) return 0;
        const ids = expiredRooms.map((r) => r.id);

        await Promise.all([
          tx.room.updateMany({
            where: { id: { in: ids } },
            data: { isDeleted: true },
          }),
          tx.roomMember.deleteMany({
            where: { roomId: { in: ids } },
          }),
        ]);

        return ids.length;
      });

      if (result > 0) console.log(`Expired ${result} rooms`);
    } catch (error) {
      console.error("Room expiry cron error:", error);
    }
  });

  // JOB 2 — Blacklist users with 3+ reports
  cron.schedule("*/10 * * * *", async () => {
    try {
      const usersToBlacklist = await prisma.$queryRaw<
        { reportedUserId: string }[]
      >`
        SELECT bl."reportedUserId"
        FROM "BlacklistUser" bl
        JOIN "user" u ON u.id = bl."reportedUserId"
        WHERE
          u."isBlacklisted" = false
        GROUP BY bl."reportedUserId"
        HAVING COUNT(DISTINCT bl."reportedById") >= 3
      `;

      if (usersToBlacklist.length === 0) return;

      const ids = usersToBlacklist.map((u) => u.reportedUserId);

      await prisma.user.updateMany({
        where: { id: { in: ids }, isBlacklisted: false },
        data: {
          isBlacklisted: true,
          suspendedUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      console.log(`Blacklisted ${ids.length} users`);
    } catch (error) {
      console.error("Blacklist users cron error:", error);
    }
  });

  // JOB 3 — Blacklist rooms with 5+ reports
  cron.schedule("*/10 * * * *", async () => {
    try {
      const roomsToBlacklist = await prisma.$queryRaw<{ roomId: string }[]>`
        SELECT br."roomId"
        FROM "BlacklistRoom" br
        JOIN "Room" r ON r.id = br."roomId"
        WHERE
          r."isBlacklisted" = false
          AND r."isDeleted" = false
        GROUP BY br."roomId"
        HAVING COUNT(DISTINCT br."reportedById") >= 5
      `;

      if (roomsToBlacklist.length === 0) return;

      const ids = roomsToBlacklist.map((r) => r.roomId);

      await prisma.room.updateMany({
        where: { id: { in: ids }, isBlacklisted: false, isDeleted: false },
        data: { isBlacklisted: true },
      });
      // Publish each blacklisted room to Kafka so worker removes from Redis immediately
      await Promise.all(
        ids.map((id) =>
          roomEvents("room-updated", {
            id,
            isBlacklisted: true,
            isDeleted: false,
          }),
        ),
      );
      console.log(`Blacklisted ${ids.length} rooms`);
    } catch (error) {
      console.error("Blacklist rooms cron error:", error);
    }
  });
}
