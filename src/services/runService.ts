import { prisma } from "../config/prisma";
import { enqueueWorkflowJob } from "../queue/workflowQueue";

export const runService = {
  async list() {
    return prisma.workflowRun.findMany({
      orderBy: { startedAt: "desc" },
      include: {
        workflow: {
          select: { id: true, name: true },
        },
      },
    });
  },

  async getById(id: string) {
    const run = await prisma.workflowRun.findUnique({
      where: { id },
      include: {
        workflow: {
          select: { id: true, name: true },
        },
        stepLogs: true,
      },
    });

    if (!run) {
      const err = new Error(`Run not found: ${id}`);
      (err as any).statusCode = 404;
      throw err;
    }

    return run;
  },

  async resumeRun(runId: string) {
    const run = await prisma.workflowRun.findUnique({
      where: { id: runId },
      include: { workflow: true },
    });

    if (!run) {
      const err = new Error(`Run not found: ${runId}`);
      (err as any).statusCode = 404;
      throw err;
    }

    if (!run.workflow.isActive) {
      const err = new Error(`Workflow is not active for run: ${runId}`);
      (err as any).statusCode = 409;
      throw err;
    }

    if (!run.currentNodeId) {
      const err = new Error(
        `Run ${runId} has no currentNodeId; nothing to resume`
      );
      (err as any).statusCode = 400;
      throw err;
    }

    const job = await enqueueWorkflowJob({
      workflowId: run.workflowId,
      payload: { resume: true },
      runId: run.id,
      startFromNodeId: run.currentNodeId,
    });

    return { run, job };
  },
};

