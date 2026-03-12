import { Request, Response, NextFunction } from "express";
import { subscriptionService } from "../services/subscriptionService";
import { prisma } from "../config/prisma";

export const checkCreateWorkflowLimit = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = (req as any).user as { userId?: string } | undefined;
  if (!user?.userId) {
    // Без пользователя лимиты не применяем (для простоты)
    return next();
  }

  const ok = await subscriptionService.canCreateWorkflow(user.userId);
  if (!ok) {
    return res.status(403).json({
      message:
        "Free plan limit reached. Upgrade to Pro to create more workflows.",
    });
  }

  next();
};

export const checkRunWorkflowLimit = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  const workflow = await prisma.workflow.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (!workflow?.userId) {
    // у workflow нет владельца — пока не ограничиваем
    return next();
  }

  const ok = await subscriptionService.canRunWorkflowForOwner(workflow.userId);
  if (!ok) {
    return res.status(403).json({
      message:
        "Free plan daily run limit reached. Upgrade to Pro to run more workflows.",
    });
  }

  next();
};

