import { Router } from "express";
import { z } from "zod";
import { create, update, getAll, getById, patchStatus, listLogs, remove } from "../controllers/workflow.controller";
import { listMembers, invite, accept, decline, remove as removeMember } from "../controllers/member.controller";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";

const workflowJsonSchema = z.object({
  nodes: z.array(z.any()).min(1, "At least one node is required"),
  edges: z.array(z.any()),
});

const createWorkflowSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  workflowJson: workflowJsonSchema,
});

const updateWorkflowSchema = z.object({
  name: z.string().min(1, "Name is required").max(255).optional(),
  workflowJson: workflowJsonSchema.optional(),
  slackWebhook: z.string().optional(),
});

const router = Router();

// Core workflow CRUD
router.post("/", authenticate, validate(createWorkflowSchema), create);
router.get("/", authenticate, getAll);
router.get("/:id", authenticate, getById);
router.put("/:id", authenticate, validate(updateWorkflowSchema), update);
router.patch("/:id", authenticate, validate(updateWorkflowSchema), update);
router.patch("/:id/status", authenticate, patchStatus);
router.delete("/:id", authenticate, remove);

// Activity logs
router.get("/:id/logs", authenticate, listLogs);

// Members
router.get("/:id/members", authenticate, listMembers);
router.post("/:id/invite", authenticate, invite);
router.post("/:id/invite/:inviteId/accept", authenticate, accept);
router.post("/:id/invite/:inviteId/decline", authenticate, decline);
router.delete("/:id/members/:userId", authenticate, removeMember);

export default router;
