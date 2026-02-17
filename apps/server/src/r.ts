import { Router } from "express";
import { AuthHandler } from "./middleware";
import { Rooms } from "./c";
const roomRouter = Router();

roomRouter.get("/", AuthHandler, Rooms.getRooms);
roomRouter.get("/u", AuthHandler, Rooms.getUser);
export { roomRouter };
