import { Router } from "express";
import { z } from "zod";
import {
  create,
  createInAppHandler,
  list,
  listMine,
  unreadCount,
  markRead,
  markAllRead,
  getPreferencesHandler,
  updatePreferencesHandler,
} from "../controllers/notification.controller";
import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/auth";

const createSchema = z.object({
  userId: z.string().min(1, "userId is required"),
  type: z.enum(["workflow_invite", "trial_expiration", "workflow_error"]),
  channel: z.enum(["telegram", "email"]),
  title: z.string().min(1, "title is required").max(255),
  message: z.string().min(1, "message is required"),
  recipient: z.string().min(1, "recipient is required"),
});

const createInAppSchema = z.object({
  userId: z.string().min(1),
  type: z.string().min(1),
  title: z.string().min(1).max(255),
  message: z.string().min(1),
  relatedId: z.string().optional(),
  meta: z.record(z.any()).optional(),
});

const router = Router();

// Public / service-to-service routes
router.get("/", list);
router.post("/", validate(createSchema), create);
router.post("/in-app", validate(createInAppSchema), createInAppHandler);

// Authenticated user routes
router.get("/me", authenticate, listMine);
router.get("/me/unread-count", authenticate, unreadCount);
router.patch("/:id/read", authenticate, markRead);
router.post("/me/read-all", authenticate, markAllRead);

// Notification preferences
router.get("/me/preferences", authenticate, getPreferencesHandler);
router.put("/me/preferences", authenticate, updatePreferencesHandler);

export default router;
