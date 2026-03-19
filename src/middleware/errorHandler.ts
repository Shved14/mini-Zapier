import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const status =
    err instanceof AppError
      ? err.statusCode
      : (err as any).statusCode ?? 500;

  const isOperational =
    err instanceof AppError ? err.isOperational : !!(err as any).statusCode;

  if (!isOperational) {
    logger.error("Unhandled error", err);
  }

  res.status(status).json({
    message: isOperational ? err.message : "Internal Server Error",
    ...((err as any).details ? { details: (err as any).details } : {}),
  });
};

