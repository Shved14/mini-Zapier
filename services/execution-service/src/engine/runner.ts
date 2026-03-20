import { WorkflowJobData } from "../queue/workflow.queue";
import { buildGraph } from "./graph";
import { getExecutor } from "../executors/registry";
import { ExecutorResult } from "../executors/base.executor";
import { logger } from "../utils/logger";
import {
  SlackContext,
  sendWorkflowStarted,
  sendStepStarted,
  sendStepCompleted,
  sendWorkflowFinished,
} from "../services/slackService";

export interface NodeLog {
  nodeId: string;
  type: string;
  status: "success" | "failed";
  input: unknown;
  output: unknown;
  error?: string;
  durationMs: number;
  startedAt: string;
  finishedAt: string;
}

export interface WorkflowResult {
  workflowId: string;
  status: "completed" | "failed";
  logs: NodeLog[];
  finalOutput: unknown;
  totalDurationMs: number;
}

export async function runWorkflow(data: WorkflowJobData): Promise<WorkflowResult> {
  const startTime = Date.now();
  const logs: NodeLog[] = [];
  const nodeOutputs = new Map<string, unknown>();

  logger.info(`Starting workflow execution`, { workflowId: data.workflowId, userId: data.userId });

  const graph = buildGraph(data.workflowJson.nodes, data.workflowJson.edges);
  const totalSteps = graph.sorted.length;
  const workflowName = data.workflowName || "Unnamed Workflow";

  // ── Slack context ──
  const slackCtx: SlackContext = {
    webhookUrl: data.slackWebhook || undefined,
  };
  const hasSlack = !!slackCtx.webhookUrl;

  // ── Notify: Workflow Started ──
  if (hasSlack) {
    const threadTs = await sendWorkflowStarted(slackCtx, {
      workflowName,
      workflowId: data.workflowId,
      totalSteps,
    });
    if (threadTs) {
      slackCtx.threadTs = threadTs;
    }
  }

  let lastOutput: unknown = null;
  let failed = false;

  for (let stepIndex = 0; stepIndex < graph.sorted.length; stepIndex++) {
    const nodeId = graph.sorted[stepIndex];
    const node = graph.nodes.get(nodeId)!;
    const executor = getExecutor(node.type);

    // Collect inputs from parent nodes
    const parentIds: string[] = [];
    for (const [source, targets] of graph.adjacency.entries()) {
      if (targets.includes(nodeId)) {
        parentIds.push(source);
      }
    }

    let nodeInput: unknown;
    if (parentIds.length === 0) {
      nodeInput = null;
    } else if (parentIds.length === 1) {
      nodeInput = nodeOutputs.get(parentIds[0]) ?? null;
    } else {
      // Merge multiple parent outputs
      const merged: Record<string, unknown> = {};
      for (const pid of parentIds) {
        const out = nodeOutputs.get(pid);
        if (typeof out === "object" && out !== null) {
          Object.assign(merged, out);
        }
      }
      nodeInput = merged;
    }

    logger.info(`Executing node ${nodeId} (${node.type})`, { workflowId: data.workflowId });

    // ── Notify: Step Started ──
    if (hasSlack) {
      sendStepStarted(slackCtx, { nodeId, nodeType: node.type, stepIndex, totalSteps });
    }

    const nodeStart = Date.now();
    let result: ExecutorResult;

    try {
      result = await executor.run(node.config, nodeInput);
    } catch (err: any) {
      result = { success: false, error: err.message };
    }

    const durationMs = Date.now() - nodeStart;

    const finishedAt = new Date().toISOString();
    const log: NodeLog = {
      nodeId,
      type: node.type,
      status: result.success ? "success" : "failed",
      input: nodeInput,
      output: result.data ?? null,
      error: result.error,
      durationMs,
      startedAt: new Date(nodeStart).toISOString(),
      finishedAt,
    };
    logs.push(log);

    // ── Notify: Step Completed ──
    if (hasSlack) {
      sendStepCompleted(slackCtx, {
        nodeId,
        nodeType: node.type,
        stepIndex,
        totalSteps,
        status: result.success ? "success" : "failed",
        durationMs,
        error: result.error,
      });
    }

    if (!result.success) {
      logger.error(`Node ${nodeId} failed: ${result.error}`, { workflowId: data.workflowId });
      failed = true;
      break;
    }

    nodeOutputs.set(nodeId, result.data);
    lastOutput = result.data;
  }

  const totalDurationMs = Date.now() - startTime;

  logger.info(`Workflow ${failed ? "failed" : "completed"}`, {
    workflowId: data.workflowId,
    totalDurationMs,
    nodesExecuted: logs.length,
  });

  // ── Notify: Workflow Finished ──
  if (hasSlack) {
    const lastError = logs.find((l) => l.error)?.error;
    sendWorkflowFinished(slackCtx, {
      workflowName,
      workflowId: data.workflowId,
      status: failed ? "failed" : "completed",
      totalDurationMs,
      stepsCompleted: logs.filter((l) => l.status === "success").length,
      totalSteps,
      error: lastError,
    });
  }

  return {
    workflowId: data.workflowId,
    status: failed ? "failed" : "completed",
    logs,
    finalOutput: lastOutput,
    totalDurationMs,
  };
}
