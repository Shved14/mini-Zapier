import { workflowQueue } from "../queue/workflow.queue";
import { logger } from "../utils/logger";

function getJobStatus(job: any): string {
  if (job.failedReason) return "failed";
  if (job.finishedOn) return "completed";
  if (job.progress > 0) return "running";
  return "pending";
}

export async function getStats(userId: string) {
  const waiting = await workflowQueue.getWaiting();
  const active = await workflowQueue.getActive();
  const completed = await workflowQueue.getCompleted();
  const failed = await workflowQueue.getFailed();

  const allJobs = [...waiting, ...active, ...completed, ...failed];
  const userJobs = allJobs.filter((job) => {
    const jobData = job.data as any;
    return jobData.userId === userId;
  });

  const total = userJobs.length;
  const successful = userJobs.filter((j) => getJobStatus(j) === "completed").length;
  const failedCount = userJobs.filter((j) => getJobStatus(j) === "failed").length;
  const paused = userJobs.filter(
    (j) => getJobStatus(j) === "pending" || getJobStatus(j) === "running"
  ).length;

  // Calculate average execution time
  let totalDuration = 0;
  let durationCount = 0;
  for (const job of userJobs) {
    if (job.finishedOn && job.timestamp) {
      totalDuration += job.finishedOn - job.timestamp;
      durationCount++;
    }
  }
  const avgExecutionTime = durationCount > 0 ? Math.round(totalDuration / durationCount) : 0;

  // Find slowest step from job results
  let slowestStep: { nodeType: string; duration: number } | undefined;
  for (const job of userJobs) {
    const result = job.returnvalue as any;
    if (result && Array.isArray(result.steps)) {
      for (const step of result.steps) {
        if (step.duration && (!slowestStep || step.duration > slowestStep.duration)) {
          slowestStep = { nodeType: step.nodeType || step.type || "unknown", duration: step.duration };
        }
      }
    }
  }

  return {
    total,
    successful,
    failed: failedCount,
    paused,
    avgExecutionTime,
    slowestStep: slowestStep || null,
    runsOverTime: [],
    recentActivity: [],
    totalChange: 0,
    successfulChange: 0,
    failedChange: 0,
    pausedChange: 0,
  };
}

export async function getRunsOverTime(userId: string) {
  const completed = await workflowQueue.getCompleted();
  const failed = await workflowQueue.getFailed();

  const allJobs = [...completed, ...failed];
  const userJobs = allJobs.filter((job) => {
    const jobData = job.data as any;
    return jobData.userId === userId;
  });

  // Group by day for the last 7 days
  const now = new Date();
  const days: { date: string; count: number }[] = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    const dayLabel = date.toLocaleDateString("en-US", { weekday: "short" });

    const count = userJobs.filter((job) => {
      if (!job.timestamp) return false;
      const jobDate = new Date(job.timestamp).toISOString().split("T")[0];
      return jobDate === dateStr;
    }).length;

    days.push({ date: dayLabel, count });
  }

  return { data: days };
}

export async function getRecentActivity(userId: string) {
  const waiting = await workflowQueue.getWaiting();
  const active = await workflowQueue.getActive();
  const completed = await workflowQueue.getCompleted();
  const failed = await workflowQueue.getFailed();

  const allJobs = [...waiting, ...active, ...completed, ...failed];
  const userJobs = allJobs
    .filter((job) => {
      const jobData = job.data as any;
      return jobData.userId === userId;
    })
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
    .slice(0, 10);

  return userJobs.map((job) => {
    const jobData = job.data as any;
    const status = getJobStatus(job);
    let action = "Started workflow";
    if (status === "completed") action = "Workflow completed";
    if (status === "failed") action = "Workflow failed";
    if (status === "running") action = "Workflow running";

    return {
      userName: jobData.userEmail || jobData.userId || "User",
      action: `${action}: ${jobData.workflowName || "Unknown"}`,
      time: job.timestamp ? new Date(job.timestamp).toISOString() : new Date().toISOString(),
    };
  });
}
