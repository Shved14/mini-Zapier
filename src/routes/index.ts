import { Router } from "express";
import { triggerRoutes } from "./triggers";
import { workflowController } from "../controllers/workflowController";
import { runController } from "../controllers/runController";
import { authRoutes } from "./auth";
import {
  checkCreateWorkflowLimit,
  checkRunWorkflowLimit,
} from "../middleware/subscriptionMiddleware";
import { userController } from "../controllers/userController";
import { authMiddleware } from "../middleware/authMiddleware";

export const routes = Router();

routes.use("/auth", authRoutes);
routes.use(triggerRoutes);

// Workflows CRUD
routes.post("/workflows", checkCreateWorkflowLimit, workflowController.create);
routes.get("/workflows", workflowController.list);
routes.get("/workflows/:id", workflowController.getById);
routes.put("/workflows/:id", workflowController.update);
routes.delete("/workflows/:id", workflowController.remove);

// Run workflow
routes.post(
  "/workflows/:id/run",
  checkRunWorkflowLimit,
  workflowController.run
);

// Runs
routes.get("/runs", runController.list);
routes.get("/runs/:id", runController.getById);

// User profile
routes.get("/users/me", authMiddleware, userController.me);
routes.patch("/users/me", authMiddleware, userController.updateMe);

