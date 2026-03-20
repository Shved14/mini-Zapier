import { randomUUID } from "crypto";
import { prisma } from "../utils/prisma";
import { logEmail } from "./email.service";
import { logActivity } from "./activity.service";

export interface CreateInvitationData {
  workflowId: string;
  email: string;
  role: string;
  inviterUserId: string;
}

export async function createInvitation(data: CreateInvitationData) {
  // Check for pending invitation
  const existingInvitation = await prisma.invitation.findFirst({
    where: {
      workflowId: data.workflowId,
      email: data.email,
      status: "pending",
    },
  });

  if (existingInvitation) {
    throw new Error("Invitation already sent to this email");
  }

  // Create invitation
  const invitation = await prisma.invitation.create({
    data: {
      workflowId: data.workflowId,
      email: data.email,
      role: data.role,
      token: randomUUID(),
    },
  });

  // Get workflow details for email
  const workflow = await prisma.workflow.findUnique({
    where: { id: data.workflowId },
  });

  if (!workflow) {
    throw new Error("Workflow not found");
  }

  // Send invitation email
  const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:3007'}/invite/${invitation.token}`;

  try {
    await logEmail({
      to: data.email,
      subject: `Invitation to join workflow: ${workflow.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">You're invited to join a workflow!</h2>
          <p>You have been invited to join the workflow <strong>"${workflow.name}"</strong>.</p>
          <p>You've been invited as a <strong>${data.role}</strong>.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteLink}" 
               style="background-color: #6366f1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Accept Invitation
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">If you can't click the button, copy and paste this link into your browser:</p>
          <p style="color: #666; font-size: 14px; word-break: break-all;">${inviteLink}</p>
          <p style="color: #666; font-size: 14px;">This invitation will expire in 7 days.</p>
        </div>
      `,
    });
  } catch (emailError) {
    console.error("Failed to send invitation email:", emailError);
    // Don't throw error - invitation is still created
  }

  // Log the activity
  await logActivity(data.workflowId, data.inviterUserId, "member_invited", {
    email: data.email,
    role: data.role,
  });

  return invitation;
}

export async function getInvitationByToken(token: string) {
  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: {
      workflow: true,
    },
  });

  if (!invitation) {
    throw new Error("Invitation not found");
  }

  if (invitation.status !== "pending") {
    throw new Error("Invitation is no longer valid");
  }

  // Check if invitation is older than 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  if (invitation.createdAt < sevenDaysAgo) {
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: "expired" },
    });
    throw new Error("Invitation has expired");
  }

  return invitation;
}

export async function acceptInvitation(token: string, userId: string) {
  const invitation = await getInvitationByToken(token);

  // Update invitation status
  await prisma.invitation.update({
    where: { id: invitation.id },
    data: { status: "accepted" },
  });

  // Create WorkflowMember record so the user actually has access
  const existingMember = await prisma.workflowMember.findUnique({
    where: { workflowId_userId: { workflowId: invitation.workflowId, userId } },
  });

  if (!existingMember) {
    await prisma.workflowMember.create({
      data: {
        workflowId: invitation.workflowId,
        userId,
        role: invitation.role || "editor",
        status: "accepted",
      },
    });
  }

  // Log the activity
  await logActivity(invitation.workflowId, userId, "member_joined", {
    email: invitation.email,
    role: invitation.role,
  });

  return { message: "Invitation accepted", workflowId: invitation.workflowId };
}

export async function declineInvitation(token: string) {
  const invitation = await getInvitationByToken(token);

  // Update invitation status
  await prisma.invitation.update({
    where: { id: invitation.id },
    data: { status: "declined" },
  });

  // Don't log invitation decline - it's not a real member action

  return { message: "Invitation declined" };
}

export async function cancelInvitation(invitationId: string) {
  const invitation = await prisma.invitation.findUnique({
    where: { id: invitationId },
  });

  if (!invitation) {
    throw new Error("Invitation not found");
  }

  // Delete the invitation
  await prisma.invitation.delete({
    where: { id: invitationId },
  });

  // Don't log invitation cancellation - it's not a real member action

  return { message: "Invitation cancelled" };
}

export async function getInvitationsForWorkflow(workflowId: string) {
  return prisma.invitation.findMany({
    where: { workflowId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPendingInvitationsForUser(email: string) {
  return prisma.invitation.findMany({
    where: {
      email: email.toLowerCase(),
      status: "pending",
    },
    include: {
      workflow: true,
    },
    orderBy: { createdAt: "desc" },
  });
}
