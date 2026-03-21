import { Request, Response, NextFunction } from "express";
import {
  getSubscription,
  activateTrial,
  upgradePlan,
  checkLimits,
} from "../services/subscription.service";

export async function getSubscriptionHandler(
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
    const result = await getSubscription(user.userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function activateTrialHandler(
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
    const result = await activateTrial(user.userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function upgradePlanHandler(
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
    const { plan } = req.body;
    if (!plan) {
      res.status(400).json({ message: "plan is required" });
      return;
    }
    const result = await upgradePlan(user.userId, plan);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function checkLimitsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.headers["x-user-id"] as string || (req as any).user?.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    const result = await checkLimits(userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}
