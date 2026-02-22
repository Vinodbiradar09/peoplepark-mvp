import "dotenv/config";
import http from "http";

import { createHttpApp } from "./http";
//import { infra } from "./infra";
import { Admin } from "@repo/kafka";
import { RoomManager } from "./w";
import { fatal } from "./fatal";
//import "@repo/redis";

async function bootstrap() {
  // infra();
  await Admin();
  const app = createHttpApp();
  const server = http.createServer(app);
  new RoomManager(server);
  const PORT = process.env.PORT;
  server.listen(PORT);
}

bootstrap().catch(fatal);


