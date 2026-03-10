import { prisma } from "../config/prisma";
import { WorkflowRunStatus } from "@prisma/client";

export type StepLogStatus = "running" | "success" | "failed";

export const logService = {
  async createRun(workflowId: string) {
    return prisma.workflowRun.create({
      data: {
        workflowId,
        status: WorkflowRunStatus.running,
        startedAt: new Date(),
      },
    });
  },

  async finishRunSuccess(runId: string) {
    return prisma.workflowRun.update({
      where: { id: runId },
      data: {
        status: WorkflowRunStatus.success,
        finishedAt: new Date(),
      },
    });
  },

  async finishRunFailed(runId: string) {
    return prisma.workflowRun.update({
      where: { id: runId },
      data: {
        status: WorkflowRunStatus.failed,
        finishedAt: new Date(),
      },
    });
  },

  async pauseRun(runId: string) {
    return prisma.workflowRun.update({
      where: { id: runId },
      data: {
        status: WorkflowRunStatus.paused,
        finishedAt: new Date(),
      },
    });
  },

  async setCurrentNode(runId: string, nodeId: string) {
    return prisma.workflowRun.update({
      where: { id: runId },
      data: { currentNodeId: nodeId },
    });
  },

  async startStep(params: {
    runId: string;
    stepId: string;
    stepType: string;
    input: unknown;
  }) {
    const { runId, stepId, stepType, input } = params;

    return prisma.stepLog.create({
      data: {
        runId,
        stepId,
        stepType,
        status: "running",
        input: input as any,
        startedAt: new Date(),
        createdAt: new Date(),
      },
    });
  },

  async finishStep(params: {
    stepLogId: string;
    status: Exclude<StepLogStatus, "running">;
    output?: unknown;
    error?: string;
  }) {
    const { stepLogId, status, output, error } = params;

    return prisma.stepLog.update({
      where: { id: stepLogId },
      data: {
        status,
        output: output as any,
        error: error ?? undefined,
        finishedAt: new Date(),
      },
    });
  },
};

