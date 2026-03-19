import { Request, Response } from "express";
import { workflowService } from "../services/workflowService";
import { enqueueWorkflowExecution } from "../services/triggerService";
import { activityLogService } from "../services/activityLogService";
import { slackService } from "../services/slackService";

export const workflowController = {
  async create(req: Request, res: Response) {
    const body = req.body ?? {};
    const user = (req as any).user as { userId?: string } | undefined;

    if (!body.name || !body.name.trim()) {
      return res.status(400).json({ message: "Workflow name is required" });
    }

    const workflow = await workflowService.create(
      {
        name: body.name,
        description: body.description,
        isActive: body.isActive,
        trigger: body.trigger,
        nodes: body.nodes,
        edges: body.edges,
        settings: body.settings,
        workflowJson: body.workflowJson,
        slackWebhook: body.slackWebhook,
      },
      user?.userId
    );
    res.status(201).json(workflow);
  },

  async list(req: Request, res: Response) {
    const user = (req as any).user as { userId?: string } | undefined;
    const workflows = await workflowService.list(user?.userId);
    res.json({ items: workflows });
  },

  async getById(req: Request, res: Response) {
    const workflow = await workflowService.getById(req.params.id);
    res.json(workflow);
  },

  async update(req: Request, res: Response) {
    const user = (req as any).user as { userId?: string } | undefined;
    const workflow = await workflowService.update(req.params.id, req.body ?? {}, user?.userId);
    res.json(workflow);
  },

  async remove(req: Request, res: Response) {
    const user = (req as any).user as { userId?: string } | undefined;
    await workflowService.remove(req.params.id, user?.userId);
    res.status(204).send();
  },

  async run(req: Request, res: Response) {
    const { id } = req.params;
    const payload = req.body ?? {};
    const user = (req as any).user as { userId?: string } | undefined;

    const job = await enqueueWorkflowExecution({
      workflowId: id,
      payload,
      source: "webhook",
    });

    if (user?.userId) {
      await activityLogService.log({
        workflowId: id,
        userId: user.userId,
        action: "workflow_executed",
      });
    }

    await slackService.sendWebhook(id, "Workflow executed", { jobId: job.id ?? "unknown" });

    res.status(202).json({
      message: "Workflow run enqueued",
      jobId: job.id,
    });
  },
};

