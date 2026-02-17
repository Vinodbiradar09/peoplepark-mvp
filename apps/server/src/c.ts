import { prisma } from "@repo/db";
import { Request, Response } from "express";
import { RedisCache } from "@repo/redis";

const cache = new RedisCache();

const Rooms = {
  async getRooms(req: Request, res: Response) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          error: "Unauthorized User",
          success: false,
        });
      }
      const rooms = await cache.getOrSet(
        "rooms",
        ["available"],
        async () => {
          return prisma.room.findMany({
            where: {
              isDeleted: false,
            },
          });
        },
        { ttl: 300, lockTTL: 10 },
      );
      return res.status(200).json({
        success: true,
        message: "All rooms",
        rooms,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: "internal server error",
        success: false,
      });
    }
  },

  async getUser(req: Request, res: Response) {
    try {
      const user = await cache.getOrSet(
        "user",
        [req.user.id],
        async () => {
          return await prisma.user.findUnique({
            where: {
              id: req.user.id,
            },
          });
        },
        { ttl: 300, lockTTL: 10 },
      );

      return res.status(200).json({
        message: "user got",
        success: true,
        user,
      });
    } catch (error) {
      console.log("error", error);
      return res.status(500).json({
        error: "internal server error",
        success: false,
      });
    }
  },
};

export { Rooms };
