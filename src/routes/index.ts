import { Router, Request, Response } from "express";
import { getWorkflowQueue } from "../queue";

export const routes = Router();

routes.get("/workflows", async (req: Request, res: Response) => {
  // Placeholder route for listing workflows
  res.json({ workflows: [] });
});

routes.post("/workflows/:id/run", async (req: Request, res: Response) => {
  const { id } = req.params;
  const payload = req.body ?? {};

  const queue = getWorkflowQueue();
  const job = await queue.add("run-workflow", {
    workflowId: id,
    payload,
  });

  res.status(202).json({
    message: "Workflow run enqueued",
    jobId: job.id,
  });
});

