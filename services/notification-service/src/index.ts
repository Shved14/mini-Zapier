import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import notificationRoutes from "./routes/notification.routes";
import { errorHandler } from "./controllers/notification.controller";
import { prisma } from "./utils/prisma";

const app = express();
const PORT = process.env.PORT || 3006;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "notification-service" });
});

app.use("/notifications", notificationRoutes);

app.use(errorHandler);

async function main() {
  try {
    await prisma.$connect();
    console.log("Connected to database");

    app.listen(PORT, () => {
      console.log(`Notification service running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start notification service:", error);
    process.exit(1);
  }
}

main();
