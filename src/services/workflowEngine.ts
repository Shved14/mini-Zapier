import { prisma } from "../config/prisma";
import { WorkflowRunStatus } from "@prisma/client";
import { logger } from "../utils/logger";
import axios from "axios";
import { env } from "../config/env";

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

const stepExecutors: Record<string, StepExecutor> = {};

export const registerStepExecutor = (type: string, executor: StepExecutor) => {
  stepExecutors[type] = executor;
};

const getByPath = (obj: unknown, path: string): unknown => {
  if (obj === null || obj === undefined) return undefined;
  if (!path) return obj;

  const segments = path.split(".");
  let current: any = obj;

  for (const seg of segments) {
    if (current == null) return undefined;
    current = current[seg];
  }

  return current;
};

const interpolateTemplate = (
  template: string,
  context: Record<string, unknown>
): string => {
  return template.replace(/{{\s*([^}]+)\s*}}/g, (_match, rawPath) => {
    const path = String(rawPath).trim();
    const value = getByPath(context, path);
    if (value === undefined || value === null) {
      return "";
    }
    if (typeof value === "object") {
      try {
        return JSON.stringify(value);
      } catch {
        return "";
      }
    }
    return String(value);
  });
};

/**
 * HTTP executor
 * config:
 * {
 *   method?: "GET" | "POST" | ... (по умолчанию "GET")
 *   url: string
 *   headers?: Record<string, string>
 *   query?: Record<string, string | number>
 *   body?: any            // если не задано, можно использовать input
 * }
 */
registerStepExecutor("http", async ({ node, input }) => {
  const cfg = (node.config ?? {}) as {
    method?: string;
    url?: string;
    headers?: Record<string, string>;
    query?: Record<string, string | number>;
    body?: unknown;
  };

  if (!cfg.url) {
    throw new Error(`HTTP node "${node.id}" is missing "url" in config`);
  }

  const method = (cfg.method ?? "GET").toUpperCase();

  const response = await axios.request({
    method,
    url: cfg.url,
    headers: cfg.headers,
    params: cfg.query,
    data: cfg.body !== undefined ? cfg.body : input,
    validateStatus: () => true,
  });

  if (response.status >= 400) {
    throw new Error(
      `HTTP request failed with status ${response.status}: ${JSON.stringify(
        response.data
      )}`
    );
  }

  return {
    status: response.status,
    headers: response.headers,
    data: response.data,
  };
});

/**
 * Transform executor
 * config:
 * {
 *   mode?: "pick" | "map" (по умолчанию "pick")
 *   fields?: string[]      // для "pick": взять указанные ключи из объекта input
 *   map?: Record<string, string> // для "map": outKey -> inPath (dot-notation)
 *   mapping?: Record<string, string> // alias для map, чтобы совпасть с JSON из примера
 * }
 */
registerStepExecutor("transform", async ({ node, input }) => {
  const cfg = (node.config ?? {}) as {
    mode?: "pick" | "map";
    fields?: string[];
    map?: Record<string, string>;
    mapping?: Record<string, string>;
  };

  const mode = cfg.mode ?? "pick";

  if (input === null || typeof input !== "object") {
    // если нечего трансформировать — просто вернуть как есть
    return input;
  }

  if (mode === "pick" && Array.isArray(cfg.fields)) {
    const out: Record<string, unknown> = {};
    for (const key of cfg.fields) {
      const value = getByPath(input, key);
      if (value !== undefined) {
        out[key] = value;
      }
    }
    return out;
  }

  if (mode === "map" && (cfg.map || cfg.mapping)) {
    const mapping = cfg.map ?? cfg.mapping ?? {};
    const out: Record<string, unknown> = {};
    for (const [outKey, inPath] of Object.entries(mapping)) {
      out[outKey] = getByPath(input, inPath);
    }
    return out;
  }

  // по умолчанию — прозрачно
  return input;
});

/**
 * Telegram executor
 * config:
 * {
 *   chatId?: string                 // если не указан — берём env.TELEGRAM_DEFAULT_CHAT_ID
 *   text?: string                   // если не указан — сериализуем input
 *   parseMode?: "MarkdownV2" | "HTML"
 * }
 */
registerStepExecutor("telegram", async ({ node, input }) => {
  const cfg = (node.config ?? {}) as {
    chatId?: string;
    text?: string;
    parseMode?: "MarkdownV2" | "HTML";
  };

  const token = env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN is not configured");
  }

  const chatId = cfg.chatId ?? env.TELEGRAM_DEFAULT_CHAT_ID;
  if (!chatId) {
    throw new Error(
      `Telegram node "${node.id}" has no chatId and TELEGRAM_DEFAULT_CHAT_ID is not set`
    );
  }

  const context =
    input && typeof input === "object" ? (input as Record<string, unknown>) : {};

  let text =
    cfg.text ??
    "Workflow output:\n" + "```json\n" + JSON.stringify(input, null, 2) + "\n```";

  // Поддержка шаблонов {{path.to.field}} в тексте
  text = interpolateTemplate(text, context);

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  const response = await axios.post(url, {
    chat_id: chatId,
    text,
    parse_mode: cfg.parseMode,
  });

  if (response.status >= 400 || !response.data.ok) {
    throw new Error(
      `Telegram sendMessage failed: ${response.status} ${JSON.stringify(
        response.data
      )}`
    );
  }

  return {
    messageId: response.data.result.message_id,
    chatId,
  };
});

const getExecutorForNode = (node: WorkflowNode): StepExecutor => {
  const executor = stepExecutors[node.type];
  if (!executor) {
    throw new Error(`No executor registered for node type "${node.type}"`);
  }
  return executor;
};

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

      try {
        const executor = getExecutorForNode(node);
        output = await executor({
          workflowId,
          runId: run.id,
          node,
          input: currentInput,
        });
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
          input: currentInput as any,
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

