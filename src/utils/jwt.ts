import jwt from "jsonwebtoken";
import { env } from "../config/env";

export type JwtPayload = {
  userId: string;
  email: string;
};

export const signJwt = (payload: JwtPayload, expiresIn?: string) => {
  if (!env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: expiresIn ?? env.JWT_EXPIRES_IN ?? "7d",
  });
};

export const verifyJwt = (token: string): JwtPayload => {
  if (!env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
};

