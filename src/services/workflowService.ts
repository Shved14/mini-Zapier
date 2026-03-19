import { prisma } from "../config/prisma";
import { validateWorkflowJson } from "../utils/workflowValidator";
import { activityLogService } from "./activityLogService";
import { slackService } from "./slackService";

type CreateWorkflowInput = {
  name: string;
  description?: string;
  isActive?: boolean;
  trigger?: unknown;
  nodes?: unknown;
  edges?: unknown;
  settings?: unknown;
  workflowJson?: unknown;
  slackWebhook?: string;
};

type UpdateWorkflowInput = Partial<CreateWorkflowInput>;

export const workflowService = {
  async create(data: CreateWorkflowInput, ownerUserId?: string) {
    if (!data.name || !data.name.trim()) {
      const err = new Error("Workflow name is required");
      (err as any).statusCode = 400;
      throw err;
    }

    const { workflowJson, ...rest } = data;

    // Validate workflowJson if provided
    if (workflowJson) {
      const validation = validateWorkflowJson(workflowJson);
      if (!validation.valid) {
        const err = new Error("Invalid workflow JSON: " + validation.errors.map(e => `${e.field}: ${e.message}`).join("; "));
        (err as any).statusCode = 400;
        (err as any).details = validation.errors;
        throw err;
      }
    }

    const workflow = await prisma.workflow.create({
      data: {
        name: rest.name.trim(),
        description: rest.description,
        userId: ownerUserId || "",
        isActive: rest.isActive ?? true,
        trigger: (rest.trigger ?? { type: "manual", config: {} }) as any,
        nodes: (rest.nodes ?? []) as any,
        edges: (rest.edges ?? []) as any,
        settings: (rest.settings ?? {}) as any,
        slackWebhook: rest.slackWebhook ?? null,
      },
    });

    if (workflowJson) {
      await prisma.workflowVersion.create({
        data: {
          workflowId: workflow.id,
          version: 1,
          workflowJson: workflowJson as any,
        },
      });
    }

    // Create owner as member
    if (ownerUserId) {
      await prisma.workflowMember.create({
        data: {
          workflowId: workflow.id,
          userId: ownerUserId,
          role: "owner",
        },
      });

      await activityLogService.log({
        workflowId: workflow.id,
        userId: ownerUserId,
        action: "workflow_created",
        metadata: { name: workflow.name },
      });
    }

    return workflow;
  },

  async list(userId?: string) {
    if (!userId) {
      return prisma.workflow.findMany({
        orderBy: { createdAt: "desc" },
      });
    }

    // Return workflows where user is owner or member
    return prisma.workflow.findMany({
      where: {
        OR: [
          { userId },
          { members: { some: { userId } } },
        ],
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async getById(id: string) {
    const workflow = await prisma.workflow.findUnique({
      where: { id },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });

    if (!workflow) {
      const err = new Error(`Workflow not found: ${id}`);
      (err as any).statusCode = 404;
      throw err;
    }

    // Get latest workflow version
    const latestVersion = await prisma.workflowVersion.findFirst({
      where: { workflowId: id },
      orderBy: { version: "desc" },
    });

    return {
      ...workflow,
      workflowJson: latestVersion?.workflowJson ?? null,
    };
  },

  async update(id: string, data: UpdateWorkflowInput, userId?: string) {
    const { workflowJson, ...rest } = data;

    // Validate workflowJson if provided
    if (workflowJson) {
      const validation = validateWorkflowJson(workflowJson);
      if (!validation.valid) {
        const err = new Error("Invalid workflow JSON: " + validation.errors.map(e => `${e.field}: ${e.message}`).join("; "));
        (err as any).statusCode = 400;
        (err as any).details = validation.errors;
        throw err;
      }
    }

    const updateData: Record<string, unknown> = {};
    if (rest.name !== undefined) updateData.name = rest.name.trim();
    if (rest.description !== undefined) updateData.description = rest.description;
    if (rest.isActive !== undefined) updateData.isActive = rest.isActive;
    if (rest.trigger !== undefined) updateData.trigger = rest.trigger as any;
    if (rest.nodes !== undefined) updateData.nodes = rest.nodes as any;
    if (rest.edges !== undefined) updateData.edges = rest.edges as any;
    if (rest.settings !== undefined) updateData.settings = rest.settings as any;
    if (rest.slackWebhook !== undefined) updateData.slackWebhook = rest.slackWebhook || null;

    const workflow = await prisma.workflow.update({
      where: { id },
      data: updateData,
    });

    if (workflowJson) {
      const lastVersion = await prisma.workflowVersion.findFirst({
        where: { workflowId: id },
        orderBy: { version: "desc" },
      });

      const nextVersion = (lastVersion?.version ?? 0) + 1;

      await prisma.workflowVersion.create({
        data: {
          workflowId: id,
          version: nextVersion,
          workflowJson: workflowJson as any,
        },
      });
    }

    // Activity logging
    if (userId) {
      if (rest.name !== undefined) {
        await activityLogService.log({
          workflowId: id,
          userId,
          action: "workflow_renamed",
          metadata: { name: rest.name },
        });
      }
      if (workflowJson) {
        await activityLogService.log({
          workflowId: id,
          userId,
          action: "workflow_updated",
        });
      }
      if (rest.isActive !== undefined) {
        await activityLogService.log({
          workflowId: id,
          userId,
          action: "status_changed",
          metadata: { isActive: rest.isActive },
        });
      }
      if (rest.slackWebhook !== undefined) {
        await activityLogService.log({
          workflowId: id,
          userId,
          action: "settings_updated",
          metadata: { slackWebhook: rest.slackWebhook ? "set" : "removed" },
        });
      }
    }

    // Slack notification for updates
    await slackService.sendWebhook(id, "Workflow updated", {
      name: workflow.name,
      ...(rest.name !== undefined ? { newName: rest.name } : {}),
      ...(rest.isActive !== undefined ? { isActive: rest.isActive } : {}),
    });

    return workflow;
  },

  async remove(id: string, currentUserId?: string) {
    const workflow = await prisma.workflow.findUnique({
      where: { id },
    });

    if (!workflow) {
      const err = new Error(`Workflow not found: ${id}`);
      (err as any).statusCode = 404;
      throw err;
    }

    if (workflow.userId && workflow.userId !== currentUserId) {
      const err = new Error("You are not allowed to delete this workflow");
      (err as any).statusCode = 403;
      throw err;
    }

    await prisma.workflow.delete({
      where: { id },
    });
  },
};

