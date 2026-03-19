import { Router } from "express";
import { z } from "zod";
import { register, login, me, googleCallback, githubCallback } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters"),
  name: z.string().min(1).max(100).optional(),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const oauthSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().optional(),
});

const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.get("/me", authenticate, me);

router.post("/google/callback", validate(oauthSchema), googleCallback);
router.post("/github/callback", validate(oauthSchema), githubCallback);

export default router;
