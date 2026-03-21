import { prisma } from "../utils/prisma";
import { AppError } from "./workflow.service";

export async function createVersion(workflowId: string, workflowJson: unknown) {
  const lastVersion = await (prisma as any).workflowVersion.findFirst({
    where: { workflowId },
    orderBy: { version: "desc" },
    select: { version: true },
  });

  const nextVersion = (lastVersion?.version ?? 0) + 1;

  return (prisma as any).workflowVersion.create({
    data: {
      workflowId,
      version: nextVersion,
      workflowJson: workflowJson as any,
    },
  });
}

export async function getVersions(workflowId: string) {
  return (prisma as any).workflowVersion.findMany({
    where: { workflowId },
    orderBy: { version: "desc" },
    select: {
      id: true,
      workflowId: true,
      version: true,
      workflowJson: true,
      createdAt: true,
    },
  });
}

export async function getVersionById(versionId: string) {
  const version = await (prisma as any).workflowVersion.findUnique({
    where: { id: versionId },
  });
  if (!version) throw new AppError(404, "Version not found");
  return version;
}

export async function restoreVersion(workflowId: string, versionId: string, userId: string) {
  const version = await getVersionById(versionId);

  if (version.workflowId !== workflowId) {
    throw new AppError(400, "Version does not belong to this workflow");
  }

  // Save current state as a new version before restoring
  const currentWorkflow = await prisma.workflow.findUnique({ where: { id: workflowId } });
  if (currentWorkflow) {
    await createVersion(workflowId, currentWorkflow.workflowJson);
  }

  // Restore the workflow to the selected version
  const updated = await prisma.workflow.update({
    where: { id: workflowId },
    data: { workflowJson: version.workflowJson },
  });

  return updated;
}
