import { prisma } from "../config/prisma";
import * as bcrypt from "bcryptjs";
import { signJwt } from "../utils/jwt";
import { env } from "../config/env";
import nodemailer from "nodemailer";
import { subscriptionService } from "./subscriptionService";
import { emailService } from "./emailService";
import crypto from "crypto";

export const authService = {
  async sendVerificationCode(email: string) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      const err = new Error("User already exists");
      (err as any).statusCode = 409;
      throw err;
    }

    // Delete old codes for this email
    await prisma.emailVerification.deleteMany({ where: { email } });

    const code = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    await prisma.emailVerification.create({
      data: { email, code, expiresAt },
    });

    await emailService.sendVerificationCode(email, code);
    return { message: "Verification code sent" };
  },

  async verifyEmailAndRegister(email: string, code: string, password: string, name?: string) {
    const record = await prisma.emailVerification.findFirst({
      where: { email, code },
      orderBy: { createdAt: "desc" },
    });

    if (!record) {
      const err = new Error("Invalid verification code");
      (err as any).statusCode = 400;
      throw err;
    }

    if (record.expiresAt < new Date()) {
      await prisma.emailVerification.delete({ where: { id: record.id } });
      const err = new Error("Verification code expired");
      (err as any).statusCode = 400;
      throw err;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      const err = new Error("User already exists");
      (err as any).statusCode = 409;
      throw err;
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, name, password: hash, provider: "local" },
    });
    await subscriptionService.createDefaultForUser(user.id);

    // Clean up verification record
    await prisma.emailVerification.delete({ where: { id: record.id } });

    const token = signJwt({ userId: user.id, email: user.email });
    return { user, token };
  },

  async register(email: string, password: string, name?: string) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      const err = new Error("User already exists");
      (err as any).statusCode = 409;
      throw err;
    }
    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hash,
        provider: "local",
      },
    });
    await subscriptionService.createDefaultForUser(user.id);
    const token = signJwt({ userId: user.id, email: user.email });
    return { user, token };
  },

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) {
      const err = new Error("Invalid credentials");
      (err as any).statusCode = 401;
      throw err;
    }
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      const err = new Error("Invalid credentials");
      (err as any).statusCode = 401;
      throw err;
    }
    const token = signJwt({ userId: user.id, email: user.email });
    return { user, token };
  },

  async upsertOAuthUser(params: {
    email: string;
    name?: string;
    provider: string;
  }) {
    const { email, name, provider } = params;
    const user = await prisma.user.upsert({
      where: { email },
      update: { name, provider },
      create: { email, name, provider },
    });
    const token = signJwt({ userId: user.id, email: user.email });
    return { user, token };
  },

  async sendMagicLink(email: string) {
    const user =
      (await prisma.user.findUnique({ where: { email } })) ??
      (await prisma.user.create({
        data: { email, provider: "magic-link" },
      }));

    if (!env.MAGIC_LINK_SECRET || !env.MAGIC_LINK_BASE_URL) {
      const err = new Error("Magic link env vars are not configured");
      (err as any).statusCode = 500;
      throw err;
    }

    const token = signJwt({ userId: user.id, email: user.email }, "15m");
    const link = `${env.MAGIC_LINK_BASE_URL}/api/auth/magic-link/verify?token=${encodeURIComponent(
      token
    )}`;

    const transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT ?? 587,
      secure: false,
      auth:
        env.SMTP_USER && env.SMTP_PASS
          ? {
            user: env.SMTP_USER,
            pass: env.SMTP_PASS,
          }
          : undefined,
    });

    await transporter.sendMail({
      from: env.SMTP_FROM ?? env.SMTP_USER,
      to: email,
      subject: "Your Mini Zapier magic login link",
      text: `Click to sign in: ${link}`,
    });
  },
};

