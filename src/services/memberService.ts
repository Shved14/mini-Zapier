import { prisma } from "../config/prisma";
import crypto from "crypto";
import { emailService } from "./emailService";
import { activityLogService } from "./activityLogService";
import { env } from "../config/env";

type MemberRole = "owner" | "editor" | "viewer";

export const memberService = {
  async listMembers(workflowId: string) {
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      select: { userId: true },
    });

    const members = await prisma.workflowMember.findMany({
      where: { workflowId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    const invites = await prisma.workflowInvite.findMany({
      where: { workflowId, status: "pending" },
      orderBy: { createdAt: "desc" },
    });

    return { ownerId: workflow?.userId, members, invites };
  },

  async inviteByEmail(params: {
    workflowId: string;
    email: string;
    role: MemberRole;
    inviterId: string;
  }) {
    const { workflowId, email, role, inviterId } = params;

    const workflow = await prisma.workflow.findUnique({ where: { id: workflowId } });
    if (!workflow) {
      const err = new Error("Workflow not found");
      (err as any).statusCode = 404;
      throw err;
    }

    // Check if already a member
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      const existingMember = await prisma.workflowMember.findUnique({
        where: { workflowId_userId: { workflowId, userId: existingUser.id } },
      });
      if (existingMember) {
        const err = new Error("User is already a member");
        (err as any).statusCode = 409;
        throw err;
      }
    }

    // Check for existing pending invite
    const existingInvite = await prisma.workflowInvite.findFirst({
      where: { workflowId, email, status: "pending" },
    });
    if (existingInvite) {
      return existingInvite;
    }

    const token = crypto.randomUUID();

    const invite = await prisma.workflowInvite.create({
      data: {
        workflowId,
        email,
        token,
        role,
        status: "pending",
      },
    });

    // Send invite email
    const inviteLink = `${env.FRONTEND_URL}/invite/${token}`;
    await emailService.sendInviteEmail(email, workflow.name, inviteLink);

    await activityLogService.log({
      workflowId,
      userId: inviterId,
      action: "member_invited",
      metadata: { email, role },
    });

    return invite;
  },

  async acceptInvite(token: string, userId: string) {
    const invite = await prisma.workflowInvite.findUnique({ where: { token } });
    if (!invite || invite.status !== "pending") {
      const err = new Error("Invalid or expired invite");
      (err as any).statusCode = 400;
      throw err;
    }

    // Check if already a member
    const existingMember = await prisma.workflowMember.findUnique({
      where: { workflowId_userId: { workflowId: invite.workflowId, userId } },
    });
    if (existingMember) {
      await prisma.workflowInvite.update({
        where: { id: invite.id },
        data: { status: "accepted" },
      });
      return existingMember;
    }

    const member = await prisma.workflowMember.create({
      data: {
        workflowId: invite.workflowId,
        userId,
        role: invite.role,
      },
    });

    await prisma.workflowInvite.update({
      where: { id: invite.id },
      data: { status: "accepted" },
    });

    await activityLogService.log({
      workflowId: invite.workflowId,
      userId,
      action: "member_joined",
      metadata: { role: invite.role },
    });

    return member;
  },

  async removeMember(workflowId: string, targetUserId: string, removerId: string) {
    await prisma.workflowMember.delete({
      where: { workflowId_userId: { workflowId, userId: targetUserId } },
    });

    await activityLogService.log({
      workflowId,
      userId: removerId,
      action: "member_removed",
      metadata: { removedUserId: targetUserId },
    });
  },

  async leaveWorkflow(workflowId: string, userId: string) {
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      include: {
        members: true,
      },
    });

    if (!workflow) {
      const err = new Error("Workflow not found");
      (err as any).statusCode = 404;
      throw err;
    }

    // If user is the owner
    if (workflow.userId === userId) {
      const otherMembers = workflow.members.filter((m: { userId: string }) => m.userId !== userId);

      if (otherMembers.length === 0) {
        // No other members — delete workflow
        await prisma.workflow.delete({ where: { id: workflowId } });
        return { action: "deleted" as const };
      }

      // Transfer ownership to first other member
      const newOwner = otherMembers[0];
      await prisma.workflow.update({
        where: { id: workflowId },
        data: { userId: newOwner.userId },
      });

      // Update their role to owner
      await prisma.workflowMember.update({
        where: { id: newOwner.id },
        data: { role: "owner" },
      });

      // Remove old owner from members if they have a member record
      await prisma.workflowMember.deleteMany({
        where: { workflowId, userId },
      });

      await activityLogService.log({
        workflowId,
        userId,
        action: "member_left",
        metadata: { newOwnerId: newOwner.userId },
      });

      return { action: "transferred" as const, newOwnerId: newOwner.userId };
    }

    // Regular member — just remove
    await prisma.workflowMember.deleteMany({
      where: { workflowId, userId },
    });

    await activityLogService.log({
      workflowId,
      userId,
      action: "member_left",
    });

    return { action: "left" as const };
  },

  async getMemberRole(workflowId: string, userId: string): Promise<MemberRole | null> {
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      select: { userId: true },
    });

    if (workflow?.userId === userId) return "owner";

    const member = await prisma.workflowMember.findUnique({
      where: { workflowId_userId: { workflowId, userId } },
    });

    return member?.role ?? null;
  },
};
