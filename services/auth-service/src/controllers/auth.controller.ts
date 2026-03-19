import { Request, Response, NextFunction } from "express";
import {
  registerUser,
  loginUser,
  getMe,
  oauthLogin,
  AppError,
} from "../services/auth.service";

export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, password, name } = req.body;
    const result = await registerUser({ email, password, name });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, password } = req.body;
    const result = await loginUser({ email, password });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function me(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    const result = await getMe(user.userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function googleCallback(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, name } = req.body;

    if (!email) {
      res.status(400).json({ message: "Email is required from Google OAuth" });
      return;
    }

    const result = await oauthLogin({ email, name, provider: "google" });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function githubCallback(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, name } = req.body;

    if (!email) {
      res.status(400).json({ message: "Email is required from GitHub OAuth" });
      return;
    }

    const result = await oauthLogin({ email, name, provider: "github" });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }

  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Internal server error" });
}
