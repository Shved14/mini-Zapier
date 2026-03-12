import { Request, Response } from "express";
import { workflowService } from "../services/workflowService";
import { enqueueWorkflowExecution } from "../services/triggerService";

export const workflowController = {
  async create(req: Request, res: Response) {
    const body = req.body ?? {};
    const user = (req as any).user as { userId?: string } | undefined;
    const workflow = await workflowService.create(
      {
        name: body.name,
        isActive: body.isActive,
        triggerType: body.triggerType,
        triggerConfig: body.triggerConfig,
        workflowJson: body.workflowJson,
      },
      user?.userId
    );
    res.status(201).json(workflow);
  },

  async list(_req: Request, res: Response) {
    const workflows = await workflowService.list();
    res.json({ items: workflows });
  },

  async getById(req: Request, res: Response) {
    const workflow = await workflowService.getById(req.params.id);
    res.json(workflow);
  },

  async update(req: Request, res: Response) {
    const workflow = await workflowService.update(req.params.id, req.body ?? {});
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

    const job = await enqueueWorkflowExecution({
      workflowId: id,
      payload,
      source: "webhook",
    });

    res.status(202).json({
      message: "Workflow run enqueued",
      jobId: job.id,
    });
  },
};

