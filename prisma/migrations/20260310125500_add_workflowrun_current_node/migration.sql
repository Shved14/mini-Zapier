ALTER TABLE "WorkflowRun"
  ADD COLUMN "currentNodeId" TEXT;

CREATE INDEX "WorkflowRun_currentNodeId_idx" ON "WorkflowRun"("currentNodeId");

