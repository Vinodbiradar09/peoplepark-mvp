import "dotenv/config";
import http from "http";

import { createHttpApp } from "./http";
import { Infra } from "./infra";
import { Admin } from "@repo/kafka";
import { RoomManager } from "./w";
import { fatal } from "./fatal";

async function bootstrap() {
  Infra();
  await Admin();
  const app = createHttpApp();
  const server = http.createServer(app);
  new RoomManager(server);
  const PORT = process.env.PORT;
  server.listen(PORT);
}

bootstrap().catch(fatal);


