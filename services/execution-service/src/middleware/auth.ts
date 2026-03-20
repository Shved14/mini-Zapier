import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-production";

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  console.log('[auth] Headers:', req.headers);
  console.log('[auth] X-User-ID:', req.headers['x-user-id']);
  console.log('[auth] X-User-Email:', req.headers['x-user-email']);

  // Check if user is already set by API gateway (trusted proxy)
  if ((req as any).user) {
    console.log('[auth] User already set:', (req as any).user);
    next();
    return;
  }

  // Check for user data from API gateway headers
  const userId = req.headers['x-user-id'] as string;
  const userEmail = req.headers['x-user-email'] as string;
  const userName = req.headers['x-user-name'] as string;

  console.log('[auth] Extracted from headers:', { userId, userEmail, userName });

  if (userId && userEmail) {
    (req as any).user = {
      userId,
      email: userEmail,
      name: userName || ''
    };
    console.log('[auth] User set from headers:', (req as any).user);
    next();
    return;
  }

  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ message: "Missing or invalid authorization header" });
    return;
  }

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    (req as any).user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}
