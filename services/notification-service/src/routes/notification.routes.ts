import { Router } from "express";
import { z } from "zod";
import { create, list } from "../controllers/notification.controller";
import { validate } from "../middleware/validate";

const createSchema = z.object({
  userId: z.string().min(1, "userId is required"),
  type: z.enum(["workflow_invite", "trial_expiration", "workflow_error"]),
  channel: z.enum(["telegram", "email"]),
  title: z.string().min(1, "title is required").max(255),
  message: z.string().min(1, "message is required"),
  recipient: z.string().min(1, "recipient is required"),
});

const router = Router();

router.get("/", list);
router.post("/", validate(createSchema), create);

export default router;
