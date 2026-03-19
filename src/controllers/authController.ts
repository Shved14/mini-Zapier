import { Request, Response } from "express";
import { authService } from "../services/authService";
import { verifyJwt } from "../utils/jwt";
import axios from "axios";
import { env } from "../config/env";

export const authController = {
  async register(req: Request, res: Response) {
    const { email, password, name } = req.body ?? {};
    if (!email || !password || !name) {
      return res
        .status(400)
        .json({ message: "Name, email and password are required" });
    }
    // Step 1: Send verification code instead of creating user immediately
    const result = await authService.sendVerificationCode(email);
    res.status(200).json(result);
  },

  async verifyEmail(req: Request, res: Response) {
    const { email, code, password, name } = req.body ?? {};
    if (!email || !code || !password) {
      return res
        .status(400)
        .json({ message: "Email, code and password are required" });
    }
    const result = await authService.verifyEmailAndRegister(email, code, password, name);
    res.status(201).json({
      user: { id: result.user.id, email: result.user.email, name: result.user.name },
      token: result.token,
    });
  },

  async me(req: Request, res: Response) {
    const user = (req as any).user as { userId?: string } | undefined;
    if (!user?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { userService } = await import("../services/userService");
    const me = await userService.getMe(user.userId);
    res.json(me);
  },

  async updateMe(req: Request, res: Response) {
    const user = (req as any).user as { userId?: string } | undefined;
    if (!user?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { name } = req.body ?? {};
    const { userService } = await import("../services/userService");
    const updated = await userService.updateMe(user.userId, { name });
    res.json(updated);
  },

  async login(req: Request, res: Response) {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }
    const result = await authService.login(email, password);
    res.json({
      user: { id: result.user.id, email: result.user.email, name: result.user.name },
      token: result.token,
    });
  },

  async logout(_req: Request, res: Response) {
    // Клиент просто удаляет токен; сервер может добавить сюда blacklist при необходимости
    res.json({ message: "Logged out" });
  },

  async googleOAuth(req: Request, res: Response) {
    const code = req.query.code as string | undefined;
    if (!code) {
      return res.status(400).json({ message: "Missing code" });
    }

    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_REDIRECT_URI) {
      return res.status(500).json({ message: "Google OAuth is not configured" });
    }

    const tokenRes = await axios.post(
      "https://oauth2.googleapis.com/token",
      new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: env.GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code",
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const { access_token } = tokenRes.data as { access_token: string };

    const profileRes = await axios.get(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      { headers: { Authorization: `Bearer ${access_token}` } }
    );

    const profile = profileRes.data as { email: string; name?: string };

    const result = await authService.upsertOAuthUser({
      email: profile.email,
      name: profile.name,
      provider: "google",
    });

    res.json({
      user: { id: result.user.id, email: result.user.email, name: result.user.name },
      token: result.token,
    });
  },

  async githubOAuth(req: Request, res: Response) {
    const code = req.query.code as string | undefined;
    if (!code) {
      return res.status(400).json({ message: "Missing code" });
    }

    if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET || !env.GITHUB_REDIRECT_URI) {
      return res.status(500).json({ message: "GitHub OAuth is not configured" });
    }

    const tokenRes = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: env.GITHUB_REDIRECT_URI,
      },
      { headers: { Accept: "application/json" } }
    );

    const { access_token } = tokenRes.data as { access_token: string };

    const profileRes = await axios.get("https://api.github.com/user/emails", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const emails = profileRes.data as Array<{ email: string; primary: boolean }>;
    const primary = emails.find((e) => e.primary) ?? emails[0];
    if (!primary?.email) {
      return res.status(400).json({ message: "GitHub email not found" });
    }

    const result = await authService.upsertOAuthUser({
      email: primary.email,
      provider: "github",
    });

    res.json({
      user: { id: result.user.id, email: result.user.email, name: result.user.name },
      token: result.token,
    });
  },

  async magicLinkRequest(req: Request, res: Response) {
    const { email } = req.body ?? {};
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    await authService.sendMagicLink(email);
    res.json({ message: "Magic link sent if email exists" });
  },

  async magicLinkVerify(req: Request, res: Response) {
    const token = req.query.token as string | undefined;
    if (!token) {
      return res.status(400).json({ message: "Missing token" });
    }
    const payload = verifyJwt(token);
    const result = await authService.upsertOAuthUser({
      email: payload.email,
      provider: "magic-link",
    });
    res.json({
      user: { id: result.user.id, email: result.user.email, name: result.user.name },
      token: result.token,
    });
  },
};

