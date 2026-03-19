import { prisma } from "../config/prisma";
import { logger } from "../utils/logger";

export const slackService = {
  async sendWebhook(workflowId: string, event: string, details: Record<string, unknown>) {
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      select: { slackWebhook: true, name: true },
    });

    if (!workflow?.slackWebhook) return;

    const text = `*[${workflow.name}]* ${event}\n${Object.entries(details)
      .map(([k, v]) => `• ${k}: ${String(v)}`)
      .join("\n")}`;

    try {
      await fetch(workflow.slackWebhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
    } catch (err) {
      logger.error("Slack webhook failed", { workflowId, error: err });
    }
  },
};
