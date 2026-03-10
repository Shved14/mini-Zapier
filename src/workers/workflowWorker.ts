import { Worker, Job } from "bullmq";
import { WORKFLOW_QUEUE_NAME } from "../queue";
import { getRedisClient } from "../config/redis";
import { logger } from "../utils/logger";
import { prisma } from "../config/prisma";
import { WorkflowRunStatus } from "@prisma/client";

type WorkflowJobData = {
  workflowId: string;
  payload: unknown;
};

type WorkflowStep = {
  id: string;
  type: string;
  config?: unknown;
};

type WorkflowDefinition = {
  steps: WorkflowStep[];
};

const executeStep = async (
  step: WorkflowStep,
  context: { payload: unknown }
): Promise<unknown> => {
  // Здесь можно реализовать различные типы шагов (HTTP, задержка, интеграции и т.д.)
  // Пока что — простой мок, который просто возвращает входные данные + метаданные шага.
  return {
    stepId: step.id,
    stepType: step.type,
    input: context.payload,
    config: step.config,
    executedAt: new Date().toISOString(),
  };
};

export const startWorkflowWorker = () => {
  const connection = getRedisClient();

  const worker = new Worker<WorkflowJobData>(
    WORKFLOW_QUEUE_NAME,
    async (job: Job<WorkflowJobData>) => {
      const { workflowId, payload } = job.data;

      logger.info(`Processing workflow ${workflowId}`, { jobId: job.id });

      // 1. Создаём запись о запуске workflow
      const run = await prisma.workflowRun.create({
        data: {
          workflowId,
          status: WorkflowRunStatus.running,
          startedAt: new Date(),
        },
      });

      try {
        // 2. Берём последнюю версию workflow
        const workflowVersion = await prisma.workflowVersion.findFirst({
          where: { workflowId },
          orderBy: { version: "desc" },
        });

        if (!workflowVersion) {
          throw new Error(
            `No workflow version found for workflowId=${workflowId}`
          );
        }

        const definition = workflowVersion
          .workflowJson as unknown as WorkflowDefinition;

        const steps = definition?.steps ?? [];

        // 3. Последовательное выполнение шагов
        let currentContext: { payload: unknown } = { payload };

        for (const step of steps) {
          const stepStartedAt = new Date();
          let output: unknown = null;
          let errorMessage: string | null = null;
          let status = "success";

          try {
            output = await executeStep(step, currentContext);
            currentContext = { payload: output };
          } catch (err) {
            status = "failed";
            errorMessage =
              err instanceof Error ? err.message : "Unknown step error";
          }

          await prisma.stepLog.create({
            data: {
              runId: run.id,
              stepId: step.id,
              stepType: step.type,
              status,
              input: currentContext.payload as any,
              output: output as any,
              error: errorMessage ?? undefined,
              createdAt: stepStartedAt,
            },
          });

          if (status === "failed") {
            throw new Error(
              `Step ${step.id} of workflow ${workflowId} failed: ${errorMessage}`
            );
          }
        }

        // 4. Если все шаги успешно отработали — помечаем run как success
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
      } catch (err) {
        // 5. В случае ошибки — помечаем run как failed
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

        // Прокидываем ошибку дальше, чтобы BullMQ применил retry/backoff
        throw err;
      }
    },
    {
      connection,
      // concurrency = 1, чтобы шаги конкретного job всегда шли строго последовательно
      concurrency: 1,
    }
  );

  worker.on("completed", (job) =>
    logger.info(`Workflow job completed`, { jobId: job.id })
  );

  worker.on("failed", (job, err) =>
    logger.error(`Workflow job failed`, { jobId: job?.id, error: err })
  );
};

