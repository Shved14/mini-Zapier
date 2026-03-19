import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import workflowRoutes from "./routes/workflow.routes";
import { errorHandler } from "./controllers/workflow.controller";
import { prisma } from "./utils/prisma";

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "workflow-service" });
});

app.use("/workflows", workflowRoutes);

app.use(errorHandler);

async function main() {
  try {
    await prisma.$connect();
    console.log("Connected to database");

    app.listen(PORT, () => {
      console.log(`Workflow service running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start workflow service:", error);
    process.exit(1);
  }
}

main();
