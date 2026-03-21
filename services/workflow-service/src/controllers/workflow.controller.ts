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
import { createInAppNotification } from "../services/notification.service";

export async function create(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = (req as any).user;
    const { name, workflowJson } = req.body;

    // Check subscription limits before creating
    try {
      const AUTH_URL = process.env.AUTH_SERVICE_URL || "http://auth-service:3001";
      const limitsRes = await fetch(`${AUTH_URL}/auth/subscription/check-limits`, {
        headers: { "X-User-ID": user.userId },
      });
      if (limitsRes.ok) {
        const limits = await limitsRes.json() as any;
        const maxWorkflows = limits.limits?.maxWorkflows ?? -1;
        if (maxWorkflows > 0) {
          const existing = await getWorkflowsByUser(user.userId);
          if (existing.length >= maxWorkflows) {
            res.status(403).json({
              message: `Workflow limit reached (${maxWorkflows} on ${limits.plan} plan). Upgrade to PRO for unlimited workflows.`,
              code: "WORKFLOW_LIMIT_REACHED",
            });
            return;
          }
        }
      }
    } catch (limitErr: any) {
      console.warn(`Failed to check subscription limits: ${limitErr.message}`);
    }

    const workflow = await createWorkflow({
      userId: user.userId,
      name,
      workflowJson,
    });

    console.log(`✅ You created workflow "${name}"`);

    await logActivity(workflow.id, user.userId, "workflow_created", { name }, user.email);

    // Create notification
    await createInAppNotification({
      userId: user.userId,
      type: "workflow_created",
      title: "Workflow Created",
      message: `You created workflow "${name}"`,
      relatedId: workflow.id,
    });

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

    // Log workflow update
    if (previousWorkflow && workflowJson) {
      const prevJson = typeof previousWorkflow.workflowJson === 'object' ? previousWorkflow.workflowJson as any : {};
      const newJson = typeof workflowJson === 'object' ? workflowJson : {};
      const previousNodes = prevJson?.nodes || [];
      const newNodes = newJson?.nodes || [];

      if (newNodes.length > previousNodes.length) {
        console.log(`✅ You added ${newNodes.length - previousNodes.length} node(s) to workflow`);
      }
    }

    // Log specific changes
    if (name && name !== previousWorkflow.name) {
      await logActivity(id, user.userId, "workflow_renamed", {
        previousName: previousWorkflow.name,
        newName: name
      }, user.email);
    }

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

      const slackUrl = (workflow as any).slackWebhook;

      for (const node of addedNodes) {
        const label = node.data?.label || node.type || 'node';
        await logActivity(id, user.userId, "node_added", {
          nodeId: node.id,
          nodeType: node.type || 'node'
        }, user.email);
        createInAppNotification({
          userId: user.userId,
          type: "node_added",
          title: "Node Added",
          message: `Added "${label}" to "${workflow.name}"`,
          relatedId: id,
          meta: { nodeId: node.id, nodeType: node.type, workflowName: workflow.name },
        }).catch(() => { });
        if (slackUrl) {
          notifySlack(slackUrl, "Node Added", `${user.email} added a node`, {
            "Workflow": workflow.name,
            "Node": `\`${label}\` (\`${node.id}\`)`,
          });
        }
      }

      for (const node of deletedNodes) {
        const label = node.data?.label || node.type || 'node';
        await logActivity(id, user.userId, "node_deleted", {
          nodeId: node.id,
          nodeType: node.type || 'node'
        }, user.email);
        createInAppNotification({
          userId: user.userId,
          type: "node_deleted",
          title: "Node Removed",
          message: `Removed "${label}" from "${workflow.name}"`,
          relatedId: id,
          meta: { nodeId: node.id, nodeType: node.type, workflowName: workflow.name },
        }).catch(() => { });
        if (slackUrl) {
          notifySlack(slackUrl, "Node Removed", `${user.email} removed a node`, {
            "Workflow": workflow.name,
            "Node": `\`${label}\` (\`${node.id}\`)`,
          });
        }
      }

      // Log node config changes
      for (const currNode of currNodes) {
        const prevNode = prevNodes.find((p: any) => p.id === currNode.id);
        if (prevNode && JSON.stringify(prevNode.data) !== JSON.stringify(currNode.data)) {
          const label = currNode.data?.label || currNode.type || 'node';
          await logActivity(id, user.userId, "node_config_updated", {
            nodeId: currNode.id,
            nodeType: currNode.type || 'node',
            configField: 'configuration'
          }, user.email);
          createInAppNotification({
            userId: user.userId,
            type: "node_updated",
            title: "Node Updated",
            message: `Updated "${label}" in "${workflow.name}"`,
            relatedId: id,
            meta: { nodeId: currNode.id, nodeType: currNode.type, workflowName: workflow.name },
          }).catch(() => { });
          if (slackUrl) {
            notifySlack(slackUrl, "Config Updated", `${user.email} updated node config`, {
              "Workflow": workflow.name,
              "Node": `\`${label}\` (\`${currNode.id}\`)`,
            });
          }
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
        if (slackUrl) {
          notifySlack(slackUrl, "Nodes Connected", `${user.email} connected nodes`, {
            "Workflow": workflow.name,
            "Connection": `\`${edge.source}\` → \`${edge.target}\``,
          });
        }
      }

      for (const edge of deletedEdges) {
        await logActivity(id, user.userId, "edge_deleted", {
          source: edge.source,
          target: edge.target
        }, user.email);
        if (slackUrl) {
          notifySlack(slackUrl, "Nodes Disconnected", `${user.email} disconnected nodes`, {
            "Workflow": workflow.name,
            "Connection": `\`${edge.source}\` → \`${edge.target}\``,
          });
        }
      }
    }

    if (slackWebhook !== undefined) {
      await logActivity(id, user.userId, "settings_updated", { slackWebhook: !!slackWebhook }, user.email);
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
    const payload = req.body;

    // Log workflow run start
    await logActivity(id, user.userId, "workflow_run_started", { payload }, user.email);

    // Create notification
    await createInAppNotification({
      userId: user.userId,
      type: "workflow_run_started",
      title: "Workflow Started",
      message: `You started workflow execution`,
      relatedId: id,
    });

    // Fetch workflow to get workflowJson
    const workflow = await getWorkflowById(id, user.userId);
    if (!workflow) {
      res.status(404).json({ message: "Workflow not found" });
      return;
    }

    console.log(`🚀 You started workflow "${workflow.name}" execution`);

    // Call execution service
    const EXECUTION_URL = process.env.EXECUTION_SERVICE_URL || "http://execution-service:3003";
    const execRes = await fetch(`${EXECUTION_URL}/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-ID": user.userId,
        "X-User-Email": user.email || "",
        "X-User-Name": user.name || "",
      },
      body: JSON.stringify({
        workflowId: id,
        userId: user.userId,
        workflowJson: workflow.workflowJson,
        workflowName: workflow.name,
      }),
    });

    const execData = (await execRes.json()) as any;

    if (!execRes.ok) {
      res.status(execRes.status).json(execData);
      return;
    }

    res.json({
      message: "Workflow execution started",
      jobId: execData.jobId,
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
