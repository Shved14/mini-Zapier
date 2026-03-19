import cron, { ScheduledTask } from "node-cron";
import { prisma } from "../config/prisma";
import { logger } from "../utils/logger";
import { enqueueWorkflowExecution } from "./triggerService";

type CronTriggerConfig = {
  expression: string; // стандартный cron-формат node-cron
  timezone?: string;
};

const tasks = new Map<string, ScheduledTask>();

export const initCronScheduler = async () => {
  const workflows = await prisma.workflow.findMany({
    where: {
      isActive: true,
    },
    select: {
      id: true,
      trigger: true,
    },
  });

  for (const wf of workflows) {
    const triggerData = wf.trigger as unknown as { type: string; config: CronTriggerConfig };
    if (triggerData.type !== "cron") continue;

    const cfg = triggerData.config;
    const expression = cfg?.expression;

    if (!expression || !cron.validate(expression)) {
      logger.warn("Invalid cron expression for workflow", {
        workflowId: wf.id,
        expression,
      });
      continue;
    }

    if (tasks.has(wf.id)) {
      continue;
    }

    const task = cron.schedule(
      expression,
      async () => {
        try {
          await enqueueWorkflowExecution({
            workflowId: wf.id,
            payload: { trigger: { type: "cron", config: cfg } },
            source: "cron",
          });
        } catch (err) {
          logger.error("Failed to enqueue cron workflow", {
            workflowId: wf.id,
            error: err,
          });
        }
      },
      {
        timezone: cfg.timezone,
      }
    );

    tasks.set(wf.id, task);
    logger.info("Cron scheduled workflow", {
      workflowId: wf.id,
      expression,
      timezone: cfg.timezone,
    });
  }
};

export const stopCronScheduler = async () => {
  for (const [workflowId, task] of tasks.entries()) {
    try {
      task.stop();
      tasks.delete(workflowId);
    } catch {
      // ignore
    }
  }
};

export const reloadCronScheduler = async () => {
  await stopCronScheduler();
  await initCronScheduler();
};

