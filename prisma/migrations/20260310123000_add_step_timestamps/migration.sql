-- Add startedAt/finishedAt to StepLog for step duration tracking

ALTER TABLE "StepLog"
  ADD COLUMN "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "finishedAt" TIMESTAMP(3);

CREATE INDEX "StepLog_startedAt_idx" ON "StepLog"("startedAt");
CREATE INDEX "StepLog_finishedAt_idx" ON "StepLog"("finishedAt");

