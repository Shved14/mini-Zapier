-- Add 'paused' value to WorkflowRunStatus enum (PostgreSQL)
ALTER TYPE "WorkflowRunStatus" ADD VALUE IF NOT EXISTS 'paused';

