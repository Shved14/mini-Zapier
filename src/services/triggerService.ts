import { prisma } from "../config/prisma";
import { enqueueWorkflowJob } from "../queue/workflowQueue";

export const enqueueWorkflowExecution = async (params: {
  workflowId: string;
  payload: unknown;
  source: "webhook" | "cron" | "email";
}) => {
  const { workflowId, payload, source } = params;

  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
    select: { id: true, isActive: true },
  });

  if (!workflow) {
    const err = new Error(`Workflow not found: ${workflowId}`);
    (err as any).statusCode = 404;
    throw err;
  }

  if (!workflow.isActive) {
    const err = new Error(`Workflow is not active: ${workflowId}`);
    (err as any).statusCode = 409;
    throw err;
  }

  const job = await enqueueWorkflowJob({
    workflowId,
    payload: {
      source,
      ...((payload && typeof payload === "object") ? (payload as object) : { payload }),
    },
  });

  return job;
};

