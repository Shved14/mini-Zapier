import {
  WORKFLOW_QUEUE_NAME,
  getWorkflowQueue,
  initWorkflowQueue,
  enqueueWorkflowJob,
} from "./workflowQueue";

// Для обратной совместимости с существующим кодом
export { WORKFLOW_QUEUE_NAME, getWorkflowQueue, enqueueWorkflowJob };

export const initQueues = async () => {
  await initWorkflowQueue();
};

