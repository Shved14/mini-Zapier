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
import { notifySlack, notifySlackUserAction } from "../services/slack.service";

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
    await logActivity(workflow.id, user.userId, "workflow_created", { name }, user.email);
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
    await logActivity(id, user.userId, "status_changed", { status }, user.email);
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
    res.json({ logs });
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
    const { name, workflowJson, slackWebhook } = req.body;

    // Get previous workflow for comparison
    const previousWorkflow = await getWorkflowById(id, user.userId);

    const workflow = await updateWorkflow(id, user.userId, { name, workflowJson, slackWebhook });

    // Log specific changes
    if (name && name !== previousWorkflow.name) {
      await logActivity(id, user.userId, "workflow_renamed", {
        previousName: previousWorkflow.name,
        newName: name
      }, user.email);
    }

    const wh = (workflow as any).slackWebhook;
    const userName = user.email || "Unknown";

    if (workflowJson && previousWorkflow.workflowJson) {
      const prevJson = typeof previousWorkflow.workflowJson === 'object' ? previousWorkflow.workflowJson as any : {};
      const currJson = typeof workflowJson === 'object' ? workflowJson as any : {};
      const prevNodes = prevJson.nodes || [];
      const currNodes = currJson.nodes || [];
      const prevEdges = prevJson.edges || [];
      const currEdges = currJson.edges || [];

      // Log node changes
      const addedNodes = currNodes.filter((n: any) => !prevNodes.find((p: any) => p.id === n.id));
      const deletedNodes = prevNodes.filter((p: any) => !currNodes.find((n: any) => n.id === p.id));

      for (const node of addedNodes) {
        await logActivity(id, user.userId, "node_added", {
          nodeId: node.id,
          nodeType: node.type || 'node'
        }, user.email);
        notifySlackUserAction(wh, { action: "node_added", userName, workflowName: workflow.name, details: `Node: \`${node.type || 'node'}\` (\`${node.id}\`)` });
      }

      for (const node of deletedNodes) {
        await logActivity(id, user.userId, "node_deleted", {
          nodeId: node.id,
          nodeType: node.type || 'node'
        }, user.email);
        notifySlackUserAction(wh, { action: "node_deleted", userName, workflowName: workflow.name, details: `Node: \`${node.type || 'node'}\` (\`${node.id}\`)` });
      }

      // Log node config changes
      for (const currNode of currNodes) {
        const prevNode = prevNodes.find((p: any) => p.id === currNode.id);
        if (prevNode && JSON.stringify(prevNode.config) !== JSON.stringify(currNode.config)) {
          await logActivity(id, user.userId, "node_config_updated", {
            nodeId: currNode.id,
            nodeType: currNode.type || 'node',
            configField: 'configuration'
          }, user.email);
          notifySlackUserAction(wh, { action: "node_config_updated", userName, workflowName: workflow.name, details: `Node: \`${currNode.type || 'node'}\` (\`${currNode.id}\`)` });
        }
      }

      // Log edge changes
      const addedEdges = currEdges.filter((e: any) => !prevEdges.find((p: any) => p.source === e.source && p.target === e.target));
      const deletedEdges = prevEdges.filter((p: any) => !currEdges.find((e: any) => e.source === p.source && e.target === p.target));

      for (const edge of addedEdges) {
        await logActivity(id, user.userId, "edge_added", {
          source: edge.source,
          target: edge.target
        }, user.email);
        notifySlackUserAction(wh, { action: "edge_added", userName, workflowName: workflow.name, details: `\`${edge.source}\` → \`${edge.target}\`` });
      }

      for (const edge of deletedEdges) {
        await logActivity(id, user.userId, "edge_deleted", {
          source: edge.source,
          target: edge.target
        }, user.email);
        notifySlackUserAction(wh, { action: "edge_deleted", userName, workflowName: workflow.name, details: `\`${edge.source}\` → \`${edge.target}\`` });
      }
    }

    if (slackWebhook !== undefined) {
      await logActivity(id, user.userId, "settings_updated", { slackWebhook: !!slackWebhook }, user.email);
      notifySlackUserAction(wh, { action: "settings_updated", userName, workflowName: workflow.name });
    }

    res.json(workflow);
  } catch (error) {
    next(error);
  }
}

export async function run(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    // Get the workflow with its full JSON
    const workflow = await getWorkflowById(id, user.userId);

    if (!workflow.workflowJson) {
      res.status(400).json({ message: "Workflow has no configuration" });
      return;
    }

    const wfJson = workflow.workflowJson as any;
    const nodes = (wfJson.nodes || []).map((n: any) => ({
      id: n.id,
      type: n.type || n.data?.type || "unknown",
      config: n.data?.config || n.config || {},
    }));
    const edges = (wfJson.edges || []).map((e: any) => ({
      source: e.source,
      target: e.target,
    }));

    // Log workflow run start
    await logActivity(id, user.userId, "workflow_run_started", {}, user.email);

    // Call execution service
    const EXECUTION_SERVICE_URL = process.env.EXECUTION_SERVICE_URL || "http://localhost:3003";
    const execResponse = await fetch(`${EXECUTION_SERVICE_URL}/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workflowId: id,
        userId: user.userId,
        workflowName: workflow.name,
        slackWebhook: (workflow as any).slackWebhook || undefined,
        workflowJson: { nodes, edges },
      }),
    });

    const execData = await execResponse.json();

    if (!execResponse.ok) {
      throw new AppError(execResponse.status, (execData as any).message || "Execution failed");
    }

    // Notify Slack if configured (execution-service will handle step-by-step updates)
    if ((workflow as any).slackWebhook) {
      notifySlackUserAction((workflow as any).slackWebhook, {
        action: "workflow_run_started",
        userName: user.email || "Unknown",
        workflowName: workflow.name,
      });
    }

    res.json({
      message: "Workflow execution started",
      jobId: (execData as any).jobId,
      workflowId: id,
      status: "running",
    });
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
