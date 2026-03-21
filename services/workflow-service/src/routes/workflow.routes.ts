import { Router } from "express";
import { z } from "zod";
import { create, update, getAll, getById, patchStatus, listLogs, remove, run } from "../controllers/workflow.controller";
import { listMembers, accept, decline, remove as removeMember } from "../controllers/member.controller";
import { invite as inviteEmail, getInvitation, acceptInvite, declineInvite, listInvitations, cancelInvitation } from "../controllers/invitation.controller";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";

const workflowJsonSchema = z.object({
  nodes: z.array(z.any()).min(0, "Nodes must be an array"),
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

const inviteSchema = z.object({
  email: z.string().email("Valid email is required"),
  role: z.string().optional().default("editor"),
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

// Internal activity log endpoint (service-to-service, no JWT)
router.post("/:id/activity", async (req, res, next) => {
  try {
    const { logActivity } = await import("../services/activity.service");
    const { id } = req.params;
    const { userId, action, metadata } = req.body;
    if (!userId || !action) {
      res.status(400).json({ message: "userId and action are required" });
      return;
    }
    await logActivity(id, userId, action, metadata || {});
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

// Versions
router.get("/:id/versions", authenticate, async (req, res, next) => {
  try {
    const { getVersions } = await import("../services/version.service");
    const { id } = req.params;
    const versions = await getVersions(id);
    res.json(versions);
  } catch (error) {
    next(error);
  }
});

router.post("/:id/restore/:versionId", authenticate, async (req, res, next) => {
  try {
    const { restoreVersion } = await import("../services/version.service");
    const { logActivity } = await import("../services/activity.service");
    const user = (req as any).user;
    const { id, versionId } = req.params;
    const workflow = await restoreVersion(id, versionId, user.userId);
    await logActivity(id, user.userId, "version_restored", { versionId }, user.email);
    res.json(workflow);
  } catch (error) {
    next(error);
  }
});

// Members
router.get("/:id/members", authenticate, listMembers);
router.post("/:id/invite", authenticate, validate(inviteSchema), inviteEmail);
router.post("/:id/invite/:inviteId/accept", authenticate, accept);
router.post("/:id/invite/:inviteId/decline", authenticate, decline);
router.delete("/:id/members/:userId", authenticate, removeMember);

// Run workflow
router.post("/:id/run", authenticate, run);

// Email-based invitations (aliases)
router.post("/:id/invite-email", authenticate, validate(inviteSchema), inviteEmail);
router.get("/:id/invitations", authenticate, listInvitations);
router.delete("/:id/invites/:invitationId", authenticate, cancelInvitation);
router.get("/invite/:token", getInvitation);
router.post("/invite/:token/accept", authenticate, acceptInvite);
router.post("/invite/:token/decline", authenticate, declineInvite);

export default router;
