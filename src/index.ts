import "dotenv/config";
import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";

import { env } from "./config/env";
import { prisma } from "./config/prisma";
import { initQueues } from "./queue";
import { errorHandler } from "./middleware/errorHandler";
import { routes } from "./routes";
import { logger } from "./utils/logger";
import { initCronScheduler } from "./services/cronScheduler";
import { swaggerSpec } from "./config/swagger";

const app: Application = express();

app.use(cors());
app.use(express.json());

app.get("/health", async (req: Request, res: Response) => {
  const dbCheck = await prisma.$queryRaw`SELECT 1`;
  res.json({
    status: "ok",
    env: env.NODE_ENV,
    db: dbCheck ? "up" : "down",
  });
});

// Swagger docs
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api", routes);

app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({ message: "Not Found" });
});

app.use(errorHandler);

const start = async () => {
  try {
    await initQueues();
    await initCronScheduler();

    app.listen(env.PORT, () => {
      logger.info(`Server listening on port ${env.PORT}`);
    });
  } catch (err) {
    logger.error("Failed to start server", err);
    process.exit(1);
  }
};

start();

