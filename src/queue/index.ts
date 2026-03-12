import {
  WORKFLOW_QUEUE_NAME,
  getWorkflowQueue,
  enqueueWorkflowJob,
} from "./workflowQueue";

// Для обратной совместимости с существующим кодом
export { WORKFLOW_QUEUE_NAME, getWorkflowQueue, enqueueWorkflowJob };

// Сейчас дополнительных инициализаций для очередей не требуется
export const initQueues = async () => {
  getWorkflowQueue();
};

