import "dotenv/config";
import http from "http";
import { fatal } from "./fatal";
import { createHttpApp } from "./http";
import { startWorkers, shutdownWorkers } from "./go";
import { cronJobs } from "./corn/cwr";

async function bootstrap() {
  const app = createHttpApp();
  const server = http.createServer(app);

  await startWorkers();
  cronJobs();
  const PORT = process.env.PORT;
  server.listen(PORT);

  const shutdown = async () => {
    console.log("shutting down worker");
    await shutdownWorkers();
    server.close(() => process.exit(0));
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

bootstrap().catch(fatal);
