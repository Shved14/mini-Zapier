import { Router } from "express";
import { z } from "zod";
import { register, login, me, updateMe, getUserById, googleRedirect, googleCallback, githubRedirect, githubCallback, verifyEmailCode } from "../controllers/auth.controller";
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

const verifyEmailSchema = z.object({
  email: z.string().email("Invalid email address"),
  code: z.string().length(6, "Verification code must be 6 digits"),
});

const oauthSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().optional(),
});

const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/verify-email", validate(verifyEmailSchema), verifyEmailCode);
router.get("/me", authenticate, me);
router.patch("/me", authenticate, updateMe);
router.get("/users/:id", getUserById);

router.get("/google", googleRedirect);
router.get("/google/callback", googleCallback);
router.get("/github", githubRedirect);
router.get("/github/callback", githubCallback);

export default router;
