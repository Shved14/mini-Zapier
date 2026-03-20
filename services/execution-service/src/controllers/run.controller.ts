import { Request, Response, NextFunction } from "express";
import { workflowQueue } from "../queue/workflow.queue";
import { logger } from "../utils/logger";

/**
 * Extract step logs from a BullMQ job.
 * The worker stores the WorkflowResult in job.returnvalue which has a `logs` array.
 * Each log entry has: nodeId, type, status ("success"|"failed"), input, output, error, durationMs
 * We map these to the frontend StepLog format.
 */
function extractSteps(job: any): any[] {
  const returnVal = job.returnvalue;
  if (!returnVal || !returnVal.logs) return [];

  return returnVal.logs.map((log: any, index: number) => ({
    id: `${job.id}-step-${index}`,
    nodeId: log.nodeId,
    nodeType: log.type,
    status: log.status === "success" ? "completed" : "failed",
    input: log.input,
    output: log.output,
    error: log.error || null,
    startedAt: null,
    finishedAt: null,
    duration: log.durationMs,
  }));
}

function getJobStatus(job: any): string {
  if (job.failedReason) return "failed";
  if (job.finishedOn && job.returnvalue?.status === "failed") return "failed";
  if (job.finishedOn) return "completed";
  if (job.processedOn) return "running";
  return "pending";
}

export async function getRuns(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = (req as any).user;

    const [waiting, active, completed, failed] = await Promise.all([
      workflowQueue.getWaiting(),
      workflowQueue.getActive(),
      workflowQueue.getCompleted(),
      workflowQueue.getFailed(),
    ]);

    const allJobs = [...waiting, ...active, ...completed, ...failed];
    const userJobs = allJobs.filter(job => {
      return (job.data as any).userId === user.userId;
    });

    const runs = userJobs.map(job => {
      const jobData = job.data as any;
      const steps = extractSteps(job);
      return {
        id: job.id?.toString(),
        workflowId: jobData.workflowId,
        workflowName: jobData.workflowName || jobData.workflowJson?.name || "Unnamed Workflow",
        status: getJobStatus(job),
        startedAt: job.timestamp ? new Date(job.timestamp).toISOString() : null,
        finishedAt: job.finishedOn ? new Date(job.finishedOn).toISOString() : null,
        progress: steps.length > 0
          ? Math.round((steps.filter((s: any) => s.status === "completed").length / steps.length) * 100)
          : (job.finishedOn ? 100 : 0),
        error: job.failedReason || job.returnvalue?.logs?.find((l: any) => l.error)?.error || null,
        steps,
      };
    });

    runs.sort((a, b) => {
      if (!a.startedAt) return 1;
      if (!b.startedAt) return -1;
      return new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime();
    });

    res.json(runs);
  } catch (error) {
    logger.error("Failed to get runs:", error);
    next(error);
  }
}

export async function getRunById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    // Use getJob for direct lookup (more efficient than scanning all queues)
    let job = await workflowQueue.getJob(id);

    if (!job) {
      res.status(404).json({ message: "Run not found" });
      return;
    }

    const jobData = job.data as any;

    if (jobData.userId !== user.userId) {
      res.status(403).json({ message: "Access denied" });
      return;
    }

    const steps = extractSteps(job);

    const run = {
      id: job.id?.toString(),
      workflowId: jobData.workflowId,
      workflowName: jobData.workflowName || jobData.workflowJson?.name || "Unnamed Workflow",
      status: getJobStatus(job),
      startedAt: job.timestamp ? new Date(job.timestamp).toISOString() : null,
      finishedAt: job.finishedOn ? new Date(job.finishedOn).toISOString() : null,
      progress: steps.length > 0
        ? Math.round((steps.filter((s: any) => s.status === "completed").length / steps.length) * 100)
        : (job.finishedOn ? 100 : 0),
      error: job.failedReason || job.returnvalue?.logs?.find((l: any) => l.error)?.error || null,
      steps,
      logs: job.returnvalue?.logs?.map((l: any) =>
        `[${l.status}] ${l.type}:${l.nodeId} (${l.durationMs}ms)${l.error ? ' - ' + l.error : ''}`
      ) || [],
    };

    res.json(run);
  } catch (error) {
    logger.error("Failed to get run by ID:", error);
    next(error);
  }
}
