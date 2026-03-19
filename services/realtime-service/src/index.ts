import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import http from "http";
import { createSocketServer } from "./socket/server";
import eventsRoutes from "./routes/events.routes";
import { logger } from "./utils/logger";

const app = express();
const PORT = process.env.PORT || 3010;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "realtime-service" });
});

app.use("/events", eventsRoutes);

const httpServer = http.createServer(app);
createSocketServer(httpServer);

httpServer.listen(PORT, () => {
  logger.info(`Realtime service running on port ${PORT}`);
});
