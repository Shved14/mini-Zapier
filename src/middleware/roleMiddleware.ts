import { Request, Response, NextFunction } from "express";
import { memberService } from "../services/memberService";

const roleHierarchy: Record<string, number> = {
  viewer: 1,
  editor: 2,
  owner: 3,
};

export const roleMiddleware = (minimumRole: "viewer" | "editor" | "owner") => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user as { userId?: string } | undefined;
    if (!user?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const workflowId = req.params.id;
    if (!workflowId) {
      return next();
    }

    const role = await memberService.getMemberRole(workflowId, user.userId);
    if (!role) {
      return res.status(403).json({ message: "You are not a member of this workflow" });
    }

    const userLevel = roleHierarchy[role] ?? 0;
    const requiredLevel = roleHierarchy[minimumRole] ?? 0;

    if (userLevel < requiredLevel) {
      return res.status(403).json({
        message: `Requires ${minimumRole} role or higher. Your role: ${role}`,
      });
    }

    (req as any).memberRole = role;
    next();
  };
};
