import { prisma } from "../config/prisma";
import { WorkflowRunStatus } from "@prisma/client";
import { logger } from "../utils/logger";
import { actionRegistry } from "../actions/actionRegistry";

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
  const run = await prisma.workflowRun.create({
    data: {
      workflowId,
      status: WorkflowRunStatus.running,
      startedAt: new Date(),
    },
  });

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
      await prisma.workflowRun.update({
        where: { id: run.id },
        data: {
          status: WorkflowRunStatus.success,
          finishedAt: new Date(),
        },
      });
      return { runId: run.id };
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
      let status = "success";
      let errorMessage: string | null = null;
      let output: unknown = null;
      const stepInput = currentInput;

      try {
        const executor = actionRegistry[node.type];
        if (!executor) {
          throw new Error(`Unknown action type "${node.type}"`);
        }

        const result = await executor(node.config ?? {}, stepInput);

        if (!result.success) {
          throw new Error(
            `Action executor for type "${node.type}" returned success=false`
          );
        }

        output = result.output;
        currentInput = output;
      } catch (err) {
        status = "failed";
        errorMessage =
          err instanceof Error ? err.message : "Unknown workflow step error";
      }

      // 4. Логируем результат шага
      await prisma.stepLog.create({
        data: {
          runId: run.id,
          stepId: node.id,
          stepType: node.type,
          status,
          input: stepInput as any,
          output: output as any,
          error: errorMessage ?? undefined,
          createdAt: startedAt,
        },
      });

      if (status === "failed") {
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
    await prisma.workflowRun.update({
      where: { id: run.id },
      data: {
        status: WorkflowRunStatus.success,
        finishedAt: new Date(),
      },
    });

    logger.info("Workflow run completed successfully", {
      runId: run.id,
      workflowId,
    });

    return { runId: run.id };
  } catch (err) {
    // 6. Ошибка — помечаем запуск как failed
    await prisma.workflowRun.update({
      where: { id: run.id },
      data: {
        status: WorkflowRunStatus.failed,
        finishedAt: new Date(),
      },
    });

    logger.error("Workflow run failed", {
      runId: run.id,
      workflowId,
      error: err,
    });

    throw err;
  }
};

