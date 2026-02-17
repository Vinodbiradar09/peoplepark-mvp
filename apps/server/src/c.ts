import { prisma } from "@repo/db";
import { Request, Response } from "express";
import { RedisCache } from "@repo/redis";

const cache = new  RedisCache();

const Rooms = {
  async getRooms(req: Request, res: Response) {
    try {
      const user = req.user;
      if (!user || !user.id) {
        return res.status(401).json({
          error: "Unauthorized User",
          success: false,
        });
      }
      const rooms = await prisma.room.findMany({
        where: {
          isDeleted: false,
        },
      });
      return res.status(200).json({
        success: true,
        message: "All Rooms",
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

  async getUser(req : Request , res : Response){
    try {
      const cacheResult = await cache.get("user" , [req.user.id!])
      if(cacheResult){
        return res.status(200).json({
          message : "cache data",
          success : true,
          user : cacheResult,
        })
      }
      const user = await prisma.user.findUnique({
        where : {
          id : req.user.id,
        }
      })

      await cache.set("user" , [user?.id!] , user , {ttl : 120});

      return res.status(200).json({
        message : "not cache result",
        success : true,
        user,
      })

    } catch (error) {
      console.log("error" , error);
      return res.status(500).json({
        error : "internal server error",
        success : false
      })
    }
  }
};

export { Rooms };

