import { Request, Response, NextFunction } from "express";
import {
  registerUser,
  loginUser,
  getMe,
  updateUser,
  oauthLogin,
  AppError,
} from "../services/auth.service";
import { sendVerificationCode, generateVerificationCode } from "../services/email.service";
import axios from "axios";

export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, password, name } = req.body;

    // Отправляем код верификации
    const code = generateVerificationCode();
    try {
      await sendVerificationCode(email, code);
      console.log(`✅ Verification code sent to ${email}`);
    } catch (emailError) {
      console.error(`❌ Failed to send verification email to ${email}:`, emailError);
      // Продолжаем регистрацию даже если email не отправился
    }

    const result = await registerUser({ email, password, name });
    res.status(201).json({
      ...result,
      message: "Registration successful. Verification code sent to your email.",
      verificationCode: code, // Только для тестирования!
    });
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

export async function getUserById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const result = await getMe(id);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function updateMe(
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
    const result = await updateUser(user.userId, req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3007";

// --- Google OAuth ---
export function googleRedirect(_req: Request, res: Response): void {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!clientId || !redirectUri) {
    res.status(500).json({ message: "Google OAuth not configured" });
    return;
  }
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent("openid email profile")}&access_type=offline&prompt=consent`;
  res.redirect(url);
}

export async function googleCallback(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const code = req.query.code as string;
    console.log("Google OAuth callback received:", { code: code ? code.substring(0, 20) + "..." : "missing" });

    if (!code) {
      console.log("Missing code in callback");
      res.redirect(`${FRONTEND_URL}/?error=missing_code`);
      return;
    }

    console.log("Exchanging code for tokens...");
    const { data: tokens } = await axios.post("https://oauth2.googleapis.com/token", {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code",
    });

    console.log("Got tokens, fetching user profile...");
    const { data: profile } = await axios.get("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    console.log("Got user profile:", { email: profile.email, name: profile.name });
    const result = await oauthLogin({ email: profile.email, name: profile.name, provider: "google" });

    console.log("OAuth login successful, redirecting with token");
    res.redirect(`${FRONTEND_URL}/?token=${result.token}`);
  } catch (error) {
    console.error("Google OAuth error:", error);
    res.redirect(`${FRONTEND_URL}/?error=oauth_failed`);
  }
}

// --- GitHub OAuth ---
export function githubRedirect(_req: Request, res: Response): void {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = process.env.GITHUB_REDIRECT_URI;
  if (!clientId || !redirectUri) {
    res.status(500).json({ message: "GitHub OAuth not configured" });
    return;
  }
  const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent("user:email")}`;
  res.redirect(url);
}

export async function githubCallback(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const code = req.query.code as string;
    if (!code) { res.redirect(`${FRONTEND_URL}/?error=missing_code`); return; }

    const { data: tokenData } = await axios.post(
      "https://github.com/login/oauth/access_token",
      { client_id: process.env.GITHUB_CLIENT_ID, client_secret: process.env.GITHUB_CLIENT_SECRET, code, redirect_uri: process.env.GITHUB_REDIRECT_URI },
      { headers: { Accept: "application/json" } }
    );

    const accessToken = tokenData.access_token;
    const { data: profile } = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    let email = profile.email;
    if (!email) {
      const { data: emails } = await axios.get("https://api.github.com/user/emails", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const primary = emails.find((e: any) => e.primary) || emails[0];
      email = primary?.email;
    }

    if (!email) { res.redirect(`${FRONTEND_URL}/?error=no_email`); return; }

    const result = await oauthLogin({ email, name: profile.name || profile.login, provider: "github" });
    res.redirect(`${FRONTEND_URL}/?token=${result.token}`);
  } catch (error) {
    console.error("GitHub OAuth error:", error);
    res.redirect(`${FRONTEND_URL}/?error=oauth_failed`);
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
