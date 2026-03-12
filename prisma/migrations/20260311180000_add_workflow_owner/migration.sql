ALTER TABLE "Workflow"
  ADD COLUMN "userId" TEXT;

ALTER TABLE "Workflow"
  ADD CONSTRAINT "Workflow_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Workflow_userId_idx" ON "Workflow"("userId");

