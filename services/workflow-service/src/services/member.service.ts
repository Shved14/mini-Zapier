import { prisma } from "../utils/prisma";
import { AppError } from "./workflow.service";

export async function getMembers(workflowId: string, requestUserId: string) {
  const workflow = await prisma.workflow.findUnique({ where: { id: workflowId } });
  if (!workflow) throw new AppError(404, "Workflow not found");

  const isOwner = workflow.userId === requestUserId;
  const isMember = await prisma.workflowMember.findUnique({
    where: { workflowId_userId: { workflowId, userId: requestUserId } },
  });
  if (!isOwner && !isMember) throw new AppError(403, "Access denied");

  const members = await prisma.workflowMember.findMany({
    where: { workflowId },
    orderBy: { createdAt: "asc" },
  });

  const invites = await prisma.invitation.findMany({
    where: { workflowId, status: "pending" },
    orderBy: { createdAt: "desc" },
  });

  return {
    ownerId: workflow.userId,
    members,
    invites,
  };
}

export async function inviteMember(workflowId: string, ownerUserId: string, targetUserId: string, role: string = "viewer") {
  const workflow = await prisma.workflow.findUnique({ where: { id: workflowId } });
  if (!workflow) throw new AppError(404, "Workflow not found");
  if (workflow.userId !== ownerUserId) throw new AppError(403, "Only the owner can invite members");
  if (targetUserId === ownerUserId) throw new AppError(400, "Cannot invite yourself");

  const existing = await prisma.workflowMember.findUnique({
    where: { workflowId_userId: { workflowId, userId: targetUserId } },
  });
  if (existing) throw new AppError(400, "User is already a member or has a pending invite");

  const member = await prisma.workflowMember.create({
    data: { workflowId, userId: targetUserId, role, status: "pending" },
  });

  return member;
}

export async function acceptInvite(workflowId: string, memberId: string, userId: string) {
  const member = await prisma.workflowMember.findUnique({ where: { id: memberId } });
  if (!member) throw new AppError(404, "Invite not found");
  if (member.workflowId !== workflowId) throw new AppError(400, "Invalid invite");
  if (member.userId !== userId) throw new AppError(403, "This invite is not for you");
  if (member.status !== "pending") throw new AppError(400, "Invite already processed");

  return prisma.workflowMember.update({
    where: { id: memberId },
    data: { status: "accepted" },
  });
}

export async function declineInvite(workflowId: string, memberId: string, userId: string) {
  const member = await prisma.workflowMember.findUnique({ where: { id: memberId } });
  if (!member) throw new AppError(404, "Invite not found");
  if (member.workflowId !== workflowId) throw new AppError(400, "Invalid invite");
  if (member.userId !== userId) throw new AppError(403, "This invite is not for you");
  if (member.status !== "pending") throw new AppError(400, "Invite already processed");

  return prisma.workflowMember.update({
    where: { id: memberId },
    data: { status: "declined" },
  });
}

export async function removeMember(workflowId: string, targetUserId: string, ownerUserId: string) {
  const workflow = await prisma.workflow.findUnique({ where: { id: workflowId } });
  if (!workflow) throw new AppError(404, "Workflow not found");
  if (workflow.userId !== ownerUserId) throw new AppError(403, "Only the owner can remove members");

  const member = await prisma.workflowMember.findUnique({
    where: { workflowId_userId: { workflowId, userId: targetUserId } },
  });
  if (!member) throw new AppError(404, "Member not found");

  await prisma.workflowMember.delete({ where: { id: member.id } });
  return { message: "Member removed" };
}
