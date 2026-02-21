import "dotenv/config";
import { auth } from "@repo/auth";
import { fromNodeHeaders } from "better-auth/node";
import { NextFunction, Request, Response } from "express";
import cron from "node-cron";
import { prisma } from "@repo/db";

export async function AuthHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    console.log("session", session);
    if (!session || !session.user || !session.session) {
      return res.status(401).json({
        error: "Invalid session , Authentication Required",
        success: false,
      });
    }
    req.user = session.user;
    req.session = session.session;
    next();
  } catch (error) {
    console.log("error in auth handler ", error);
    return res.status(401).json({
      error: "Invalid or expired session",
      success: false,
    });
  }
}

export async function autoDeleteRoomAfter2Hours() {
  cron.schedule("*/10 * * * *", async () => {
    try {
      const rm = await prisma.$transaction(async (tx) => {
        const expiredRooms = await tx.room.findMany({
          where: {
            expiresAt: { lt: new Date() },
            isDeleted: false,
          },
          select: {
            id: true,
          },
        });
        if (expiredRooms.length === 0) return 0;
        const rmIds = expiredRooms.map((rmId) => rmId.id);
        await tx.room.updateMany({
          where: {
            id: { in: rmIds },
          },
          data: {
            isDeleted: true,
          },
        });

        await tx.roomMember.deleteMany({
          where: {
            roomId: { in: rmIds },
          },
        });
        return rmIds.length;
      });

      if (rm > 0) {
        console.log(`successfully deleted ${rm} expired rooms`);
      }
    } catch (error) {
      console.log("error in corn job", error);
    }
  });
}
