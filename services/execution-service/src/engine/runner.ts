import { WorkflowJobData } from "../queue/workflow.queue";
import { buildGraph } from "./graph";
import { getExecutor } from "../executors/registry";
import { ExecutorResult } from "../executors/base.executor";
import { logger } from "../utils/logger";

export interface NodeLog {
  nodeId: string;
  type: string;
  status: "success" | "failed";
  input: unknown;
  output: unknown;
  error?: string;
  durationMs: number;
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

  let lastOutput: unknown = null;
  let failed = false;

  for (const nodeId of graph.sorted) {
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

    const nodeStart = Date.now();
    let result: ExecutorResult;

    try {
      result = await executor.run(node.config, nodeInput);
    } catch (err: any) {
      result = { success: false, error: err.message };
    }

    const durationMs = Date.now() - nodeStart;

    const log: NodeLog = {
      nodeId,
      type: node.type,
      status: result.success ? "success" : "failed",
      input: nodeInput,
      output: result.data ?? null,
      error: result.error,
      durationMs,
    };
    logs.push(log);

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

  return {
    workflowId: data.workflowId,
    status: failed ? "failed" : "completed",
    logs,
    finalOutput: lastOutput,
    totalDurationMs,
  };
}
