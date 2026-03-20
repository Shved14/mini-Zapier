import { logger } from "../utils/logger";

// ─── Types ───────────────────────────────────────────────────────────

interface SlackBlock {
  type: string;
  [key: string]: unknown;
}

interface SlackMessage {
  blocks: SlackBlock[];
  text?: string;
  thread_ts?: string;
}

interface SlackResponse {
  ok: boolean;
  ts?: string;
  error?: string;
}

// ─── Low-level sender ────────────────────────────────────────────────

async function postToSlack(webhookUrl: string, payload: SlackMessage): Promise<string | null> {
  if (!webhookUrl) return null;

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      logger.error(`[slack] Webhook failed: ${response.status} ${text}`);
      return null;
    }

    // Slack incoming webhooks return "ok" as text, not JSON with ts
    // To use threading we need Slack API (chat.postMessage) with a bot token
    const text = await response.text();
    try {
      const json = JSON.parse(text) as SlackResponse;
      return json.ts || null;
    } catch {
      return null;
    }
  } catch (err: any) {
    logger.error(`[slack] Failed to send message: ${err.message}`);
    return null;
  }
}

async function postWithApi(botToken: string, channel: string, payload: SlackMessage): Promise<string | null> {
  if (!botToken || !channel) return null;

  try {
    const body: Record<string, unknown> = {
      channel,
      blocks: payload.blocks,
      text: payload.text || "",
    };
    if (payload.thread_ts) {
      body.thread_ts = payload.thread_ts;
    }

    const response = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${botToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = (await response.json()) as SlackResponse;
    if (!data.ok) {
      logger.error(`[slack] API error: ${data.error}`);
      return null;
    }
    return data.ts || null;
  } catch (err: any) {
    logger.error(`[slack] API call failed: ${err.message}`);
    return null;
  }
}

// ─── Block Kit Helpers ───────────────────────────────────────────────

function headerBlock(text: string): SlackBlock {
  return {
    type: "header",
    text: { type: "plain_text", text, emoji: true },
  };
}

function sectionBlock(markdown: string): SlackBlock {
  return {
    type: "section",
    text: { type: "mrkdwn", text: markdown },
  };
}

function contextBlock(elements: string[]): SlackBlock {
  return {
    type: "context",
    elements: elements.map((text) => ({ type: "mrkdwn", text })),
  };
}

function dividerBlock(): SlackBlock {
  return { type: "divider" };
}

function fieldsBlock(fields: Array<{ label: string; value: string }>): SlackBlock {
  return {
    type: "section",
    fields: fields.map((f) => ({
      type: "mrkdwn",
      text: `*${f.label}*\n${f.value}`,
    })),
  };
}

// ─── Status icons ────────────────────────────────────────────────────

function statusIcon(status: string): string {
  switch (status) {
    case "started": return "🟡";
    case "running": return "🟡";
    case "success": return "🟢";
    case "completed": return "🟢";
    case "failed": return "🔴";
    case "skipped": return "⚪";
    default: return "⚫";
  }
}

// ─── Slack context (webhook or bot token + channel) ──────────────────

export interface SlackContext {
  webhookUrl?: string;
  botToken?: string;
  channel?: string;
  threadTs?: string;
}

async function send(ctx: SlackContext, payload: SlackMessage): Promise<string | null> {
  if (ctx.botToken && ctx.channel) {
    return postWithApi(ctx.botToken, ctx.channel, payload);
  }
  if (ctx.webhookUrl) {
    return postToSlack(ctx.webhookUrl, payload);
  }
  return null;
}

// ─── Public API ──────────────────────────────────────────────────────

export async function sendWorkflowStarted(
  ctx: SlackContext,
  data: { workflowName: string; workflowId: string; userName?: string; totalSteps: number }
): Promise<string | null> {
  const blocks: SlackBlock[] = [
    headerBlock("🚀 Workflow Started"),
    fieldsBlock([
      { label: "Workflow", value: data.workflowName },
      { label: "User", value: data.userName || "System" },
      { label: "Total Steps", value: `${data.totalSteps}` },
      { label: "Workflow ID", value: `\`${data.workflowId}\`` },
    ]),
    dividerBlock(),
    contextBlock([`Started at <!date^${Math.floor(Date.now() / 1000)}^{date_short_pretty} {time_secs}|${new Date().toISOString()}>`]),
  ];

  const ts = await send(ctx, {
    blocks,
    text: `🚀 Workflow "${data.workflowName}" started`,
  });

  return ts;
}

export async function sendStepStarted(
  ctx: SlackContext,
  data: { nodeId: string; nodeType: string; stepIndex: number; totalSteps: number }
): Promise<void> {
  const blocks: SlackBlock[] = [
    sectionBlock(`${statusIcon("started")} *Step ${data.stepIndex + 1}/${data.totalSteps}* — \`${data.nodeType}\` node started`),
    contextBlock([`Node: \`${data.nodeId}\``]),
  ];

  await send(ctx, {
    blocks,
    text: `🟡 Step ${data.stepIndex + 1}: ${data.nodeType} started`,
    thread_ts: ctx.threadTs,
  });
}

export async function sendStepCompleted(
  ctx: SlackContext,
  data: {
    nodeId: string;
    nodeType: string;
    stepIndex: number;
    totalSteps: number;
    status: "success" | "failed";
    durationMs: number;
    error?: string;
  }
): Promise<void> {
  const icon = statusIcon(data.status);
  const statusText = data.status === "success" ? "completed" : "failed";
  const durationStr = data.durationMs < 1000
    ? `${data.durationMs}ms`
    : `${(data.durationMs / 1000).toFixed(2)}s`;

  const blocks: SlackBlock[] = [
    sectionBlock(
      `${icon} *Step ${data.stepIndex + 1}/${data.totalSteps}* — \`${data.nodeType}\` ${statusText} _(${durationStr})_`
    ),
  ];

  if (data.error) {
    blocks.push(
      sectionBlock(`> ⚠️ *Error:* ${data.error.substring(0, 500)}`)
    );
  }

  blocks.push(contextBlock([`Node: \`${data.nodeId}\``]));

  await send(ctx, {
    blocks,
    text: `${icon} Step ${data.stepIndex + 1}: ${data.nodeType} ${statusText}`,
    thread_ts: ctx.threadTs,
  });
}

export async function sendWorkflowFinished(
  ctx: SlackContext,
  data: {
    workflowName: string;
    workflowId: string;
    status: "completed" | "failed";
    totalDurationMs: number;
    stepsCompleted: number;
    totalSteps: number;
    error?: string;
  }
): Promise<void> {
  const isSuccess = data.status === "completed";
  const icon = isSuccess ? "✅" : "❌";
  const title = isSuccess ? "Workflow Completed" : "Workflow Failed";
  const durationStr = data.totalDurationMs < 1000
    ? `${data.totalDurationMs}ms`
    : `${(data.totalDurationMs / 1000).toFixed(2)}s`;

  const blocks: SlackBlock[] = [
    headerBlock(`${icon} ${title}`),
    fieldsBlock([
      { label: "Workflow", value: data.workflowName },
      { label: "Status", value: isSuccess ? "✅ Success" : "❌ Failed" },
      { label: "Steps", value: `${data.stepsCompleted}/${data.totalSteps}` },
      { label: "Duration", value: durationStr },
    ]),
  ];

  if (data.error) {
    blocks.push(dividerBlock());
    blocks.push(sectionBlock(`> ⚠️ *Error:*\n> ${data.error.substring(0, 500)}`));
  }

  blocks.push(dividerBlock());
  blocks.push(
    contextBlock([`Finished at <!date^${Math.floor(Date.now() / 1000)}^{date_short_pretty} {time_secs}|${new Date().toISOString()}>`])
  );

  await send(ctx, {
    blocks,
    text: `${icon} Workflow "${data.workflowName}" ${data.status}`,
    thread_ts: ctx.threadTs,
  });
}

// ─── User Action Notifications (for workflow-service) ────────────────

export async function sendUserAction(
  ctx: SlackContext,
  data: {
    action: string;
    userName: string;
    workflowName: string;
    details?: string;
  }
): Promise<void> {
  const iconMap: Record<string, string> = {
    workflow_created: "🆕",
    workflow_updated: "📝",
    workflow_deleted: "🗑️",
    node_added: "➕",
    node_deleted: "➖",
    node_config_updated: "⚙️",
    edge_added: "🔗",
    edge_deleted: "✂️",
    status_changed: "🔄",
    settings_updated: "⚙️",
  };

  const icon = iconMap[data.action] || "📋";

  const actionLabels: Record<string, string> = {
    workflow_created: "created a workflow",
    workflow_updated: "updated a workflow",
    workflow_deleted: "deleted a workflow",
    node_added: "added a node",
    node_deleted: "removed a node",
    node_config_updated: "updated node config",
    edge_added: "connected nodes",
    edge_deleted: "disconnected nodes",
    status_changed: "changed workflow status",
    settings_updated: "updated settings",
  };

  const actionLabel = actionLabels[data.action] || data.action;

  const blocks: SlackBlock[] = [
    sectionBlock(`${icon} *${data.userName}* ${actionLabel}`),
    contextBlock([
      `Workflow: *${data.workflowName}*`,
      ...(data.details ? [`Details: ${data.details}`] : []),
    ]),
  ];

  await send(ctx, {
    blocks,
    text: `${icon} ${data.userName} ${actionLabel} in "${data.workflowName}"`,
  });
}
