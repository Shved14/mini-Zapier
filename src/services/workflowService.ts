import { prisma } from "../config/prisma";

type CreateWorkflowInput = {
  name: string;
  isActive?: boolean;
  triggerType: string;
  triggerConfig?: unknown;
  workflowJson?: unknown;
};

type UpdateWorkflowInput = Partial<CreateWorkflowInput>;

export const workflowService = {
  async create(data: CreateWorkflowInput, ownerUserId?: string) {
    const { workflowJson, ...rest } = data;

    const workflow = await prisma.workflow.create({
      data: {
        name: rest.name,
        isActive: rest.isActive ?? true,
        triggerType: rest.triggerType,
        triggerConfig: (rest.triggerConfig ?? {}) as any,
        ...(ownerUserId ? { userId: ownerUserId } : {}),
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

    return workflow;
  },

  async list() {
    return prisma.workflow.findMany({
      orderBy: { createdAt: "desc" },
    });
  },

  async getById(id: string) {
    const workflow = await prisma.workflow.findUnique({
      where: { id },
    });

    if (!workflow) {
      const err = new Error(`Workflow not found: ${id}`);
      (err as any).statusCode = 404;
      throw err;
    }

    return workflow;
  },

  async update(id: string, data: UpdateWorkflowInput) {
    const { workflowJson, ...rest } = data;

    const workflow = await prisma.workflow.update({
      where: { id },
      data: {
        ...(rest.name !== undefined ? { name: rest.name } : {}),
        ...(rest.isActive !== undefined ? { isActive: rest.isActive } : {}),
        ...(rest.triggerType !== undefined
          ? { triggerType: rest.triggerType }
          : {}),
        ...(rest.triggerConfig !== undefined
          ? { triggerConfig: rest.triggerConfig as any }
          : {}),
      },
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

    // Если у workflow есть владелец, только он может удалить
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

