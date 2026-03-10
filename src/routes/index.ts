import { Router, Request, Response } from "express";
import { enqueueWorkflowExecution } from "../services/triggerService";
import { triggerRoutes } from "./triggers";

export const routes = Router();

routes.use(triggerRoutes);

routes.get("/workflows", async (req: Request, res: Response) => {
  // Placeholder route for listing workflows
  res.json({ workflows: [] });
});

routes.post("/workflows/:id/run", async (req: Request, res: Response) => {
  const { id } = req.params;
  const payload = req.body ?? {};

  const job = await enqueueWorkflowExecution({
    workflowId: id,
    payload,
    source: "webhook",
  });

  res.status(202).json({
    message: "Workflow run enqueued",
    jobId: job.id,
  });
});

