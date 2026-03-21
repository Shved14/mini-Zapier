import { Request, Response, NextFunction } from "express";
import {
  createAndSend,
  getByUser,
  getUnreadCount,
  markRead as markReadService,
  markAllRead as markAllReadService,
  createInApp,
  getPreferences as getPrefsService,
  updatePreferences as updatePrefsService,
  AppError,
} from "../services/notification.service";

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId, type, channel, title, message, recipient } = req.body;
    const notification = await createAndSend({ userId, type, channel, title, message, recipient });
    res.status(201).json(notification);
  } catch (error) {
    next(error);
  }
}

export async function createInAppHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId, type, title, message, relatedId, meta } = req.body;
    const notification = await createInApp({ userId, type, title, message, relatedId, meta });
    res.status(201).json(notification);
  } catch (error) {
    next(error);
  }
}

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.query.userId as string;
    if (!userId) {
      res.status(400).json({ message: "userId query parameter is required" });
      return;
    }
    const notifications = await getByUser(userId);
    res.json(notifications);
  } catch (error) {
    next(error);
  }
}

export async function listMine(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    const notifications = await getByUser(userId);
    res.json(notifications);
  } catch (error) {
    next(error);
  }
}

export async function unreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    const count = await getUnreadCount(userId);
    res.json({ count });
  } catch (error) {
    next(error);
  }
}

export async function markRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    const notification = await markReadService(req.params.id, userId);
    res.json(notification);
  } catch (error) {
    next(error);
  }
}

export async function markAllRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    const result = await markAllReadService(userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getPreferencesHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) { res.status(401).json({ message: "Unauthorized" }); return; }
    const prefs = await getPrefsService(userId);
    res.json(prefs);
  } catch (error) {
    next(error);
  }
}

export async function updatePreferencesHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) { res.status(401).json({ message: "Unauthorized" }); return; }
    const prefs = req.body;
    await updatePrefsService(userId, prefs);
    const updated = await getPrefsService(userId);
    res.json(updated);
  } catch (error) {
    next(error);
  }
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Internal server error" });
}
