import { Request, Response, NextFunction } from "express";
import { workflowQueue } from "../queue/workflow.queue";
import { logger } from "../utils/logger";

export async function getRuns(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = (req as any).user;

    // Get all jobs for the user
    const waiting = await workflowQueue.getWaiting();
    const active = await workflowQueue.getActive();
    const completed = await workflowQueue.getCompleted();
    const failed = await workflowQueue.getFailed();

    // Filter jobs by user (assuming user data is stored in job data)
    const allJobs = [...waiting, ...active, ...completed, ...failed];
    const userJobs = allJobs.filter(job => {
      const jobData = job.data as any;
      return jobData.userId === user.userId;
    });

    const runs = userJobs.map(job => {
      const jobData = job.data as any;
      return {
        id: job.id?.toString(),
        workflowId: jobData.workflowId,
        workflowName: jobData.workflowName || 'Unknown Workflow',
        status: getJobStatus(job),
        startedAt: job.timestamp ? new Date(job.timestamp).toISOString() : null,
        finishedAt: job.finishedOn ? new Date(job.finishedOn).toISOString() : null,
        progress: job.progress || 0,
        result: job.returnvalue || null,
        error: job.failedReason || null,
        steps: jobData.steps || []
      };
    });

    // Sort by startedAt descending
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

    // Try to find the job in all queues
    let job = null;
    const queues = [
      await workflowQueue.getWaiting(),
      await workflowQueue.getActive(),
      await workflowQueue.getCompleted(),
      await workflowQueue.getFailed()
    ];

    for (const queueJobs of queues) {
      job = queueJobs.find(j => j.id?.toString() === id);
      if (job) break;
    }

    if (!job) {
      res.status(404).json({ message: "Run not found" });
      return;
    }

    const jobData = job.data as any;

    // Check if user has access to this run
    if (jobData.userId !== user.userId) {
      res.status(403).json({ message: "Access denied" });
      return;
    }

    const run = {
      id: job.id?.toString(),
      workflowId: jobData.workflowId,
      workflowName: jobData.workflowName || 'Unknown Workflow',
      status: getJobStatus(job),
      startedAt: job.timestamp ? new Date(job.timestamp).toISOString() : null,
      finishedAt: job.finishedOn ? new Date(job.finishedOn).toISOString() : null,
      progress: job.progress || 0,
      result: job.returnvalue || null,
      error: job.failedReason || null,
      steps: jobData.steps || [],
      logs: jobData.logs || []
    };

    res.json(run);
  } catch (error) {
    logger.error("Failed to get run by ID:", error);
    next(error);
  }
}

function getJobStatus(job: any): string {
  if (job.failedReason) return "failed";
  if (job.finishedOn) return "completed";
  if (job.progress > 0) return "running";
  return "pending";
}
