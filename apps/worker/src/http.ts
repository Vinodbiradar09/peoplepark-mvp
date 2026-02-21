import cors from "cors";
import express, { Express } from "express";

export const createHttpApp = (): Express => {
  const app = express();
  app.use(
    cors({
      origin: "*",
    }),
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });
  return app;
};
