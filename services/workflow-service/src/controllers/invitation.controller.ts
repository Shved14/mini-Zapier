import { Request, Response, NextFunction } from "express";
import { createInvitation, getInvitationByToken, acceptInvitation, declineInvitation, getInvitationsForWorkflow } from "../services/invitation.service";
import { AppError } from "../services/workflow.service";

export async function invite(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = (req as any).user;
    const { id: workflowId } = req.params;
    const { email, role = "member" } = req.body;

    if (!email) {
      throw new AppError(400, "Email is required");
    }

    const invitation = await createInvitation({
      workflowId,
      email: email.toLowerCase(),
      role,
      inviterUserId: user.userId,
    });

    res.status(201).json({
      message: "Invitation sent successfully",
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        createdAt: invitation.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getInvitation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { token } = req.params;
    const invitation = await getInvitationByToken(token);

    res.json({
      invitation: {
        id: invitation.id,
        workflow: {
          id: invitation.workflow.id,
          name: invitation.workflow.name,
        },
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        createdAt: invitation.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function acceptInvite(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = (req as any).user;
    const { token } = req.params;

    const result = await acceptInvitation(token, user.userId);

    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function declineInvite(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { token } = req.params;
    const user = (req as any).user;

    const result = await declineInvitation(token, user.userId);

    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function listInvitations(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id: workflowId } = req.params;
    const invitations = await getInvitationsForWorkflow(workflowId);

    res.json({
      invitations: invitations.map(inv => ({
        id: inv.id,
        email: inv.email,
        role: inv.role,
        status: inv.status,
        createdAt: inv.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
}
