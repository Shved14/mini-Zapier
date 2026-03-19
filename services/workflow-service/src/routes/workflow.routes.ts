import { Router } from "express";
import { z } from "zod";
import { create, update, getAll, remove } from "../controllers/workflow.controller";
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
});

const router = Router();

router.post("/", authenticate, validate(createWorkflowSchema), create);
router.get("/", authenticate, getAll);
router.put("/:id", authenticate, validate(updateWorkflowSchema), update);
router.delete("/:id", authenticate, remove);

export default router;
