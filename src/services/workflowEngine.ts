import { prisma } from "../config/prisma";
import { WorkflowRunStatus } from "@prisma/client";
import { logger } from "../utils/logger";
import { actionRegistry } from "../actions/actionRegistry";
import { logService } from "./logService";
import { notificationService } from "./notificationService";
import { WorkflowError } from "../utils/errors";

export type WorkflowNode = {
  id: string;
  type: string;
  config?: unknown;
};

export type WorkflowEdge = {
  from: string;
  to: string;
};

export type WorkflowDefinition = {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
};

export type StepExecutorContext = {
  workflowId: string;
  runId: string;
  node: WorkflowNode;
  input: unknown;
};

export type StepExecutor = (ctx: StepExecutorContext) => Promise<unknown>;

const buildGraphHelpers = (definition: WorkflowDefinition) => {
  const nodeMap = new Map<string, WorkflowNode>();
  for (const node of definition.nodes) {
    nodeMap.set(node.id, node);
  }

  const incomingCount = new Map<string, number>();
  const outgoing = new Map<string, string[]>();

  for (const node of definition.nodes) {
    incomingCount.set(node.id, 0);
    outgoing.set(node.id, []);
  }

  for (const edge of definition.edges) {
    if (!nodeMap.has(edge.from) || !nodeMap.has(edge.to)) {
      continue;
    }
    incomingCount.set(edge.to, (incomingCount.get(edge.to) ?? 0) + 1);
    outgoing.get(edge.from)!.push(edge.to);
  }

  const startNodeIds = definition.nodes
    .filter((n) => (incomingCount.get(n.id) ?? 0) === 0)
    .map((n) => n.id);

  return {
    nodeMap,
    incomingCount,
    outgoing,
    startNodeIds,
  };
};

export const executeWorkflowRun = async (params: {
  workflowId: string;
  payload: unknown;
}) => {
  const { workflowId, payload } = params;

  // 1. Создаём запись WorkflowRun со статусом running
  const run = await logService.createRun(workflowId);
  const stepTimings: Array<{
    stepId: string;
    stepType: string;
    status: "success" | "failed";
    durationMs: number;
  }> = [];

  const sleep = (ms: number) =>
    new Promise<void>((resolve) => setTimeout(resolve, ms));

  const getRetryConfig = (node: WorkflowNode) => {
    const cfg = (node.config ?? {}) as any;
    const retry = cfg.retry ?? {};
    const attempts = typeof retry.attempts === "number" ? retry.attempts : 3;
    const baseDelayMs =
      typeof retry.backoffMs === "number" ? retry.backoffMs : 1000;
    const maxDelayMs =
      typeof retry.maxBackoffMs === "number" ? retry.maxBackoffMs : 15000;
    return { attempts, baseDelayMs, maxDelayMs };
  };

  const computeBackoffMs = (attemptIndex: number, base: number, max: number) => {
    // exponential + jitter (attemptIndex starts from 1 for first retry)
    const exp = Math.min(max, base * Math.pow(2, Math.max(0, attemptIndex - 1)));
    const jitter = Math.floor(Math.random() * Math.min(250, exp));
    return Math.min(max, exp + jitter);
  };

  const classifyError = (err: unknown): "retryable" | "nonRetryable" | "critical" => {
    if (err instanceof WorkflowError) return err.kind;
    return "critical";
  };

  try {
    // 2. Загружаем последнюю версию workflow
    const workflowVersion = await prisma.workflowVersion.findFirst({
      where: { workflowId },
      orderBy: { version: "desc" },
    });

    if (!workflowVersion) {
      throw new Error(`No workflow version found for workflowId=${workflowId}`);
    }

    const definition = workflowVersion
      .workflowJson as unknown as WorkflowDefinition;

    const { nodeMap, incomingCount, outgoing, startNodeIds } =
      buildGraphHelpers(definition);

    if (startNodeIds.length === 0) {
      logger.warn("Workflow has no start nodes", { workflowId });
      await logService.finishRunSuccess(run.id);
      return { runId: run.id, steps: stepTimings };
    }

    // 3. Топологический обход графа (sequental, 1 нода за раз)
    const queue: string[] = [...startNodeIds];
    const visited = new Set<string>();

    let currentInput: unknown = payload;

    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      if (visited.has(nodeId)) continue;
      visited.add(nodeId);

      const node = nodeMap.get(nodeId);
      if (!node) continue;

      const startedAt = new Date();
      let errorMessage: string | null = null;
      let output: unknown = null;
      const stepInput = currentInput;
      const stepLog = await logService.startStep({
        runId: run.id,
        stepId: node.id,
        stepType: node.type,
        input: stepInput,
      });
      const startedAtMs = stepLog.startedAt.getTime();

      const executor = actionRegistry[node.type];
      if (!executor) {
        errorMessage = `Unknown action type "${node.type}"`;
      } else {
        const { attempts, baseDelayMs, maxDelayMs } = getRetryConfig(node);

        for (let attempt = 1; attempt <= attempts; attempt++) {
          try {
            const result = await executor(node.config ?? {}, stepInput);

            if (!result.success) {
              throw new Error(
                `Action executor for type "${node.type}" returned success=false`
              );
            }

            output = result.output;
            currentInput = output;
            errorMessage = null;
            break;
          } catch (err) {
            const kind = classifyError(err);
            const msg = err instanceof Error ? err.message : "Unknown error";
            errorMessage = msg;

            logger.warn("Step attempt failed", {
              runId: run.id,
              workflowId,
              stepId: node.id,
              stepType: node.type,
              attempt,
              attempts,
              kind,
              error: msg,
            });

            if (kind === "critical") {
              await logService.finishStep({
                stepLogId: stepLog.id,
                status: "failed",
                output,
                error: msg,
              });

              const durationMs = Date.now() - startedAtMs;
              stepTimings.push({
                stepId: node.id,
                stepType: node.type,
                status: "failed",
                durationMs,
              });

              await logService.pauseRun(run.id);
              await notificationService.telegram(
                `CRITICAL: workflow paused\nworkflowId=${workflowId}\nrunId=${run.id}\nstep=${node.type}(${node.id})\nerror=${msg}`
              );

              return { runId: run.id, steps: stepTimings, paused: true };
            }

            if (kind === "nonRetryable" || attempt === attempts) {
              break;
            }

            const backoffMs = computeBackoffMs(
              attempt,
              baseDelayMs,
              maxDelayMs
            );
            await sleep(backoffMs);
          }
        }
      }

      if (!errorMessage) {
        await logService.finishStep({
          stepLogId: stepLog.id,
          status: "success",
          output,
        });

        const durationMs = Date.now() - startedAtMs;
        stepTimings.push({
          stepId: node.id,
          stepType: node.type,
          status: "success",
          durationMs,
        });
        logger.info("Step completed", {
          runId: run.id,
          workflowId,
          stepId: node.id,
          stepType: node.type,
          durationMs,
        });
      } else {
        await logService.finishStep({
          stepLogId: stepLog.id,
          status: "failed",
          output,
          error: errorMessage,
        });

        const durationMs = Date.now() - startedAtMs;
        stepTimings.push({
          stepId: node.id,
          stepType: node.type,
          status: "failed",
          durationMs,
        });
        logger.warn("Step failed", {
          runId: run.id,
          workflowId,
          stepId: node.id,
          stepType: node.type,
          durationMs,
          error: errorMessage,
        });
      }

      if (errorMessage) {
        await notificationService.telegram(
          `Workflow failed\nworkflowId=${workflowId}\nrunId=${run.id}\nstep=${node.type}(${node.id})\nerror=${errorMessage}`
        );
        throw new Error(
          `Step ${node.id} of workflow ${workflowId} failed: ${errorMessage}`
        );
      }

      // Добавляем в очередь следующие ноды, когда у них больше нет непосещённых входящих рёбер
      const nextNodeIds = outgoing.get(nodeId) ?? [];
      for (const nextId of nextNodeIds) {
        const newIncoming =
          (incomingCount.get(nextId) ?? 0) - 1;
        incomingCount.set(nextId, newIncoming);
        if (newIncoming <= 0 && !visited.has(nextId)) {
          queue.push(nextId);
        }
      }
    }

    // 5. Все шаги успешно — обновляем статус запуска
    await logService.finishRunSuccess(run.id);

    logger.info("Workflow run completed successfully", {
      runId: run.id,
      workflowId,
    });

    return { runId: run.id, steps: stepTimings };
  } catch (err) {
    // 6. Ошибка — помечаем запуск как failed
    await logService.finishRunFailed(run.id);

    logger.error("Workflow run failed", {
      runId: run.id,
      workflowId,
      error: err,
    });

    throw err;
  }
};

