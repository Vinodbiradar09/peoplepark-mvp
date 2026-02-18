import { prisma } from "@repo/db";
import { Request, Response } from "express";
import { cache } from "./index";
import { roomSchema } from "@repo/zod"; 

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

  async createRoom( req : Request , res : Response){
    try {
      if(!req.user || !req.user.id ){
        return res.status(401).json({
          error : "Unauthorized User",
          success : false,
        })
      }
      const { success , data } = roomSchema.safeParse(req.body);
      if(!success){
        return res.status(403).json({
          error : "room details required",
          success : false,
        })
      }
      await prisma.$transaction(async( tx )=>{
        const room = await tx.room.create({
          data : {
            name : data.name,
          }
        })

        await tx.roomMember.create({
          data : {
            userId : req.user.id,
            roomId : room.id,
            role : "ADMIN",
          }
        })
      })

      return res.status(200).json({
        message : "Room created",
        success : true,
      })

    } catch (error) {
      console.log("error" , error);
      return res.status(500).json({
        error : "internal server error",
        success : false,
      })
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
