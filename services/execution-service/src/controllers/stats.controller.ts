import { Request, Response, NextFunction } from "express";
import { getStats, getRunsOverTime, getRecentActivity } from "../services/stats.service";

export async function getStatsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = (req as any).user;
    const stats = await getStats(user.userId);
    res.json(stats);
  } catch (error) {
    next(error);
  }
}

export async function getRunsOverTimeHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = (req as any).user;
    const runsOverTime = await getRunsOverTime(user.userId);
    res.json(runsOverTime);
  } catch (error) {
    next(error);
  }
}

export async function getRecentActivityHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = (req as any).user;
    const recentActivity = await getRecentActivity(user.userId);
    res.json(recentActivity);
  } catch (error) {
    next(error);
  }
}
