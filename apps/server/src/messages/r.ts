import { Router } from "express";
import { AuthHandler } from "../middleware";
import { Messages } from "./c";

const messageRouter = Router();

messageRouter.delete("/:roomId/messages", AuthHandler, Messages.deleteMessages);
messageRouter.patch(
  "/:roomId/:messageId/edit",
  AuthHandler,
  Messages.editMessage,
);

export { messageRouter };
