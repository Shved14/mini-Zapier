CREATE TABLE "Subscription" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "plan" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "trialEndsAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "Subscription"
  ADD CONSTRAINT "Subscription_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "Subscription_userId_idx" ON "Subscription"("userId");

