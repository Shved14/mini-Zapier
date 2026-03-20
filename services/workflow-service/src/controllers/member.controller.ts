import { Request, Response, NextFunction } from "express";
import {
  getMembers,
  inviteMember,
  acceptInvite,
  declineInvite,
  removeMember,
} from "../services/member.service";
import { logActivity } from "../services/activity.service";
import { notifySlack } from "../services/slack.service";
import { prisma } from "../utils/prisma";

export async function listMembers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const result = await getMembers(id, user.userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function invite(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { userId: targetUserId, role } = req.body;
    const member = await inviteMember(id, user.userId, targetUserId, role);

    await logActivity(id, user.userId, "member_invited", { targetUserId, role });

    const workflow = await prisma.workflow.findUnique({ where: { id } });
    if (workflow?.slackWebhook) {
      notifySlack(workflow.slackWebhook, "Member Added", `A new member was invited to *'${workflow.name}'*`, {
        "Workflow": workflow.name,
        "Invited User": targetUserId,
        "Role": role || "editor",
        "Invited by": user.email || "unknown",
      });
    }

    res.status(201).json(member);
  } catch (error) {
    next(error);
  }
}

export async function accept(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = (req as any).user;
    const { id, inviteId } = req.params;
    const result = await acceptInvite(id, inviteId, user.userId);
    await logActivity(id, user.userId, "invite_accepted", {});
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function decline(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = (req as any).user;
    const { id, inviteId } = req.params;
    const result = await declineInvite(id, inviteId, user.userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = (req as any).user;
    const { id, userId: targetUserId } = req.params;
    const result = await removeMember(id, targetUserId, user.userId);
    await logActivity(id, user.userId, "member_removed", { targetUserId });
    res.json(result);
  } catch (error) {
    next(error);
  }
}
