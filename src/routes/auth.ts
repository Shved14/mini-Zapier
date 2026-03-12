import { Router } from "express";
import { authController } from "../controllers/authController";

export const authRoutes = Router();

authRoutes.post("/register", authController.register);
authRoutes.post("/login", authController.login);
authRoutes.post("/logout", authController.logout);

authRoutes.get("/google/callback", authController.googleOAuth);
authRoutes.get("/github/callback", authController.githubOAuth);

authRoutes.post("/magic-link", authController.magicLinkRequest);
authRoutes.get("/magic-link/verify", authController.magicLinkVerify);

