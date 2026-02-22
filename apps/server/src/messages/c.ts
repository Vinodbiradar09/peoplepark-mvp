import { Request, Response } from "express";
import { cache } from "@repo/redis";
import { deleteMessagesSchema, editMessageSchema } from "@repo/zod";
import { prisma } from "@repo/db";

const Messages = {
  async deleteMessages(req: Request, res: Response) {
    try {
      // the sender should only delete the message
      // soft delete the message
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          message: "Unauthorized User",
          success: false,
        });
      }
      const body = req.body;
      const { roomId } = req.params;
      const { success, data } = deleteMessagesSchema.safeParse(body);
      if (!success) {
        return res.status(400).json({
          message: "message ids are required",
          success: false,
        });
      }
      if (!roomId || Array.isArray(roomId)) {
        return res.status(400).json({
          message: "room id required",
          success: false,
        });
      }
      // handle unique message Ids only
      const msgIds = new Set(data.messageIds);
      const mIds = [...msgIds];

      await prisma.messages.updateMany({
        where: {
          id: { in: mIds },
          senderId: req.user.id,
          roomId,
        },
        data: {
          isDeleted: true,
        },
      });
      await cache.delByPrefix(`cache:roomMessages:${roomId}`);
    } catch (error) {
      console.log("error", error);
      return res.status(500).json({
        message: "internal server error",
        success: false,
      });
    }
  },

  async editMessage(req: Request, res: Response) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          message: "Unauthorized User",
          success: false,
        });
      }
      const body = req.body;
      const { messageId , roomId } = req.params;
      const { success, data } = editMessageSchema.safeParse(body);
      if (!success) {
        return res.status(400).json({
          message: "the edit message is required",
          success: false,
        });
      }
      if (!messageId || Array.isArray(messageId)) {
        return res.status(400).json({
          message: "message id is required",
          success: false,
        });
      }
      if(!roomId || Array.isArray(roomId)){
        return;
      }
      const editedMsg = await prisma.messages.update({
        where: {
          id: messageId,
          senderId: req.user.id,
          roomId,
        },
        data: {
          content: data.content,
        },
      });
      await cache.delByPrefix(`cache:roomMessages:${roomId}`);
      return res.status(200).json({
        message: "the message has been edited",
        success: true,
        editedMsg,
      });
    } catch (error) {
      console.log("error", error);
      return res.status(500).json({
        message: "internal server error",
        success: false,
      });
    }
  },

  async getMessages(req: Request, res: Response) {
    try {
    } catch (error) {}
  },
};

export { Messages };
