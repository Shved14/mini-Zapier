import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-production";

export function validateJwt(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  console.log(`[validateJwt] ${req.method} ${req.originalUrl} | auth header present: ${!!header}`);

  if (!header || !header.startsWith("Bearer ")) {
    console.log("[validateJwt] REJECTED: Missing or invalid authorization header");
    res.status(401).json({ message: "Missing or invalid authorization header" });
    return;
  }

  const token = header.split(" ")[1];
  console.log(`[validateJwt] Token length: ${token.length}, secret length: ${JWT_SECRET.length}`);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    (req as any).user = decoded;
    console.log("[validateJwt] VALID token for:", (decoded as any).email);
    next();
  } catch (err: any) {
    console.log(`[validateJwt] REJECTED: ${err.message}`);
    res.status(401).json({ message: "Invalid or expired token" });
  }
}
