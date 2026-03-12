import { Router } from "express";
import { triggerRoutes } from "./triggers";
import { workflowController } from "../controllers/workflowController";
import { runController } from "../controllers/runController";
import { authRoutes } from "./auth";

export const routes = Router();

routes.use("/auth", authRoutes);
routes.use(triggerRoutes);

// Workflows CRUD
routes.post("/workflows", workflowController.create);
routes.get("/workflows", workflowController.list);
routes.get("/workflows/:id", workflowController.getById);
routes.put("/workflows/:id", workflowController.update);
routes.delete("/workflows/:id", workflowController.remove);

// Run workflow
routes.post("/workflows/:id/run", workflowController.run);

// Runs
routes.get("/runs", runController.list);
routes.get("/runs/:id", runController.getById);

