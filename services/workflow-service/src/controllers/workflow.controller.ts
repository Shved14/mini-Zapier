import { Request, Response, NextFunction } from "express";
import {
  createWorkflow,
  updateWorkflow,
  getWorkflowsByUser,
  getWorkflowById,
  updateWorkflowStatus,
  deleteWorkflow,
  AppError,
} from "../services/workflow.service";
import { logActivity } from "../services/activity.service";
import { getActivityLogs } from "../services/activity.service";
import { notifySlack } from "../services/slack.service";

export async function create(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = (req as any).user;
    const { name, workflowJson } = req.body;
    const workflow = await createWorkflow({
      userId: user.userId,
      name,
      workflowJson,
    });
    await logActivity(workflow.id, user.userId, "workflow_created", { name });
    res.status(201).json(workflow);
  } catch (error) {
    next(error);
  }
}

export async function getById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const workflow = await getWorkflowById(id, user.userId);
    res.json(workflow);
  } catch (error) {
    next(error);
  }
}

export async function patchStatus(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { status } = req.body;
    const workflow = await updateWorkflowStatus(id, user.userId, status);
    await logActivity(id, user.userId, "status_changed", { status });
    res.json(workflow);
  } catch (error) {
    next(error);
  }
}

export async function listLogs(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const logs = await getActivityLogs(id);
    res.json(logs);
  } catch (error) {
    next(error);
  }
}

export async function getAll(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = (req as any).user;
    const workflows = await getWorkflowsByUser(user.userId);
    res.json(workflows);
  } catch (error) {
    next(error);
  }
}

export async function update(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { name, workflowJson } = req.body;
    const workflow = await updateWorkflow(id, user.userId, { name, workflowJson });
    if (name) await logActivity(id, user.userId, "workflow_renamed", { name });
    if (workflowJson) await logActivity(id, user.userId, "workflow_updated", {});
    if ((workflow as any).slackWebhook && workflowJson) {
      notifySlack((workflow as any).slackWebhook, "Workflow Updated", `'${workflow.name}' was updated`);
    }
    res.json(workflow);
  } catch (error) {
    next(error);
  }
}

export async function remove(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const result = await deleteWorkflow(id, user.userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }

  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Internal server error" });
}
