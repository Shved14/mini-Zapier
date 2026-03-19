import { Router } from "express";
import { authController } from "../controllers/authController";
import { authMiddleware } from "../middleware/authMiddleware";

export const authRoutes = Router();

authRoutes.post("/register", authController.register);
authRoutes.post("/verify-email", authController.verifyEmail);
authRoutes.post("/login", authController.login);
authRoutes.post("/logout", authController.logout);

authRoutes.get("/me", authMiddleware, authController.me);
authRoutes.patch("/me", authMiddleware, authController.updateMe);

authRoutes.get("/google/callback", authController.googleOAuth);
authRoutes.get("/github/callback", authController.githubOAuth);

authRoutes.post("/magic-link", authController.magicLinkRequest);
authRoutes.get("/magic-link/verify", authController.magicLinkVerify);

