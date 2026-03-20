import { prisma } from "../utils/prisma";
import { hashPassword, comparePassword } from "../utils/password";
import { signToken } from "../utils/jwt";
import axios from "axios";

interface RegisterInput {
  email: string;
  password: string;
  name?: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface OAuthInput {
  email: string;
  name?: string;
  provider: string;
}

export async function registerUser(input: RegisterInput) {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });

  // If user exists but NOT verified, delete old record so they can re-register
  if (existing && !existing.emailVerified) {
    await prisma.user.delete({ where: { id: existing.id } });
  } else if (existing && existing.emailVerified) {
    throw new AppError(409, "User with this email already exists");
  }

  const passwordHash = await hashPassword(input.password);

  // Generate verification code
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

  // Store user with unverified status (transient until verified)
  const user = await prisma.user.create({
    data: {
      email: input.email,
      name: input.name ?? null,
      passwordHash,
      provider: "local",
      emailVerified: false,
      verificationCode,
      verificationCodeExpires: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    },
  });

  // Send verification email using Resend
  try {
    console.log('Sending verification email to:', input.email, 'API key present:', !!process.env.RESEND_API_KEY);
    const resendResponse = await axios.post('https://api.resend.com/emails', {
      from: 'onboarding@resend.dev',
      to: [input.email],
      subject: 'Verify your Mini-Zapier account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Welcome to Mini-Zapier!</h2>
          <p>Hi ${input.name || 'there'},</p>
          <p>Your verification code:</p>
          <div style="background-color: #f0f0f0; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <h1 style="font-size: 32px; color: #333; margin: 0; letter-spacing: 8px;">${verificationCode}</h1>
          </div>
          <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes.</p>
        </div>
      `,
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Verification email sent successfully:', resendResponse.data);
  } catch (emailError: any) {
    console.error('Failed to send verification email. Status:', emailError?.response?.status);
    console.error('Resend error:', JSON.stringify(emailError?.response?.data));
  }

  return {
    message: "Registration successful. Please check your email for verification code.",
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerified: false,
    },
  };
}

export async function verifyEmail(email: string, code: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  if (user.emailVerified) {
    throw new AppError(400, "Email already verified");
  }

  if (!user.verificationCode || !user.verificationCodeExpires) {
    throw new AppError(400, "No verification code sent");
  }

  if (new Date() > user.verificationCodeExpires) {
    throw new AppError(400, "Verification code expired");
  }

  if (user.verificationCode !== code) {
    throw new AppError(400, "Invalid verification code");
  }

  // Mark email as verified
  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      verificationCode: null,
      verificationCodeExpires: null,
    },
  });

  const token = signToken({ userId: user.id, email: user.email });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      provider: user.provider,
      emailVerified: true,
      createdAt: user.createdAt,
    },
  };
}

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user || !user.passwordHash) {
    throw new AppError(401, "Invalid email or password");
  }

  const valid = await comparePassword(input.password, user.passwordHash);

  if (!valid) {
    throw new AppError(401, "Invalid email or password");
  }

  if (!user.emailVerified) {
    throw new AppError(401, "Please verify your email first");
  }

  const token = signToken({ userId: user.id, email: user.email });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      provider: user.provider,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
    },
  };
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    provider: user.provider,
    createdAt: user.createdAt,
  };
}

export async function updateUser(userId: string, data: { name?: string }) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { name: data.name },
  });

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    provider: user.provider,
    createdAt: user.createdAt,
  };
}

export async function oauthLogin(input: OAuthInput) {
  let user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: input.email,
        name: input.name ?? null,
        provider: input.provider,
      },
    });
  }

  const token = signToken({ userId: user.id, email: user.email });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      provider: user.provider,
      createdAt: user.createdAt,
    },
  };
}

export class AppError extends Error {
  public statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = "AppError";
  }
}
