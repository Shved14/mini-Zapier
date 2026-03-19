import { prisma } from "../utils/prisma";

export class AppError extends Error {
  public statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = "AppError";
  }
}

interface WorkflowNode {
  id: string;
  type: string;
  config: Record<string, unknown>;
}

interface WorkflowEdge {
  source: string;
  target: string;
}

interface WorkflowJsonInput {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

interface CreateWorkflowInput {
  userId: string;
  name: string;
  workflowJson: WorkflowJsonInput;
}

function validateWorkflowJson(data: unknown): WorkflowJsonInput {
  if (typeof data !== "object" || data === null) {
    throw new AppError(400, "workflowJson must be an object");
  }

  const obj = data as Record<string, unknown>;

  if (!Array.isArray(obj.nodes)) {
    throw new AppError(400, "workflowJson.nodes must be an array");
  }

  if (!Array.isArray(obj.edges)) {
    throw new AppError(400, "workflowJson.edges must be an array");
  }

  if (obj.nodes.length === 0) {
    throw new AppError(400, "workflowJson.nodes must not be empty");
  }

  for (let i = 0; i < obj.nodes.length; i++) {
    const node = obj.nodes[i] as Record<string, unknown>;

    if (!node || typeof node !== "object") {
      throw new AppError(400, `workflowJson.nodes[${i}] must be an object`);
    }

    if (typeof node.id !== "string" || node.id.trim() === "") {
      throw new AppError(400, `workflowJson.nodes[${i}].id is required`);
    }

    if (typeof node.type !== "string" || node.type.trim() === "") {
      throw new AppError(400, `workflowJson.nodes[${i}].type is required`);
    }

    if (!node.config || typeof node.config !== "object") {
      throw new AppError(400, `workflowJson.nodes[${i}].config is required and must be an object`);
    }
  }

  const nodeIds = new Set((obj.nodes as WorkflowNode[]).map((n) => n.id));

  for (let i = 0; i < obj.edges.length; i++) {
    const edge = obj.edges[i] as Record<string, unknown>;

    if (!edge || typeof edge !== "object") {
      throw new AppError(400, `workflowJson.edges[${i}] must be an object`);
    }

    if (typeof edge.source !== "string" || !nodeIds.has(edge.source)) {
      throw new AppError(400, `workflowJson.edges[${i}].source must reference an existing node id`);
    }

    if (typeof edge.target !== "string" || !nodeIds.has(edge.target)) {
      throw new AppError(400, `workflowJson.edges[${i}].target must reference an existing node id`);
    }
  }

  return { nodes: obj.nodes as WorkflowNode[], edges: obj.edges as WorkflowEdge[] };
}

export async function createWorkflow(input: CreateWorkflowInput) {
  const validated = validateWorkflowJson(input.workflowJson);

  const workflow = await prisma.workflow.create({
    data: {
      userId: input.userId,
      name: input.name,
      workflowJson: validated as any,
    },
  });

  return workflow;
}

export async function updateWorkflow(id: string, userId: string, data: { name?: string; workflowJson?: unknown; slackWebhook?: string }) {
  const workflow = await prisma.workflow.findUnique({ where: { id } });

  if (!workflow) {
    throw new AppError(404, "Workflow not found");
  }

  if (workflow.userId !== userId) {
    throw new AppError(403, "You do not have permission to update this workflow");
  }

  const updateData: Record<string, unknown> = {};

  if (data.name !== undefined) {
    updateData.name = data.name;
  }

  if (data.workflowJson !== undefined) {
    const validated = validateWorkflowJson(data.workflowJson);
    updateData.workflowJson = validated as any;
  }

  if (data.slackWebhook !== undefined) {
    updateData.slackWebhook = data.slackWebhook;
  }

  return prisma.workflow.update({
    where: { id },
    data: updateData,
  });
}

export async function getWorkflowById(id: string, userId: string) {
  const workflow = await prisma.workflow.findUnique({
    where: { id },
    include: { members: true },
  });

  if (!workflow) throw new AppError(404, "Workflow not found");

  const isOwner = workflow.userId === userId;
  const isMember = workflow.members.some(
    (m) => m.userId === userId && m.status === "accepted"
  );

  if (!isOwner && !isMember) throw new AppError(403, "Access denied");

  return workflow;
}

export async function getWorkflowsByUser(userId: string) {
  const owned = await prisma.workflow.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  const memberOf = await prisma.workflow.findMany({
    where: {
      members: {
        some: { userId, status: "accepted" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const ids = new Set(owned.map((w) => w.id));
  const combined = [...owned, ...memberOf.filter((w) => !ids.has(w.id))];
  return combined;
}

export async function updateWorkflowStatus(id: string, userId: string, status: string) {
  const workflow = await prisma.workflow.findUnique({ where: { id } });
  if (!workflow) throw new AppError(404, "Workflow not found");
  if (workflow.userId !== userId) throw new AppError(403, "Only the owner can change status");

  return prisma.workflow.update({ where: { id }, data: { status } });
}

export async function deleteWorkflow(id: string, userId: string) {
  const workflow = await prisma.workflow.findUnique({ where: { id } });

  if (!workflow) {
    throw new AppError(404, "Workflow not found");
  }

  if (workflow.userId !== userId) {
    throw new AppError(403, "You do not have permission to delete this workflow");
  }

  await prisma.workflow.delete({ where: { id } });

  return { message: "Workflow deleted" };
}
