import { Request, Response, NextFunction } from "express";
import {
  createWorkflow,
  updateWorkflow,
  getWorkflowsByUser,
  deleteWorkflow,
  AppError,
} from "../services/workflow.service";

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
    res.status(201).json(workflow);
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
