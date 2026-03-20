interface SlackBlock {
  type: string;
  [key: string]: unknown;
}

async function postBlocks(webhookUrl: string, blocks: SlackBlock[], fallbackText: string): Promise<void> {
  if (!webhookUrl) return;

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blocks, text: fallbackText }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`[slack] Webhook error: ${response.status} ${text}`);
    }
  } catch (err: any) {
    console.error("[slack] Failed to send message:", err.message);
  }
}

export async function notifySlack(webhookUrl: string | null | undefined, event: string, details: string) {
  if (!webhookUrl) return;
  try {
    await postBlocks(webhookUrl, [
      { type: "section", text: { type: "mrkdwn", text: `*${event}*\n${details}` } },
    ], `${event}: ${details}`);
  } catch {
    // Non-critical
  }
}

export async function notifySlackUserAction(
  webhookUrl: string | null | undefined,
  data: {
    action: string;
    userName: string;
    workflowName: string;
    details?: string;
  }
) {
  if (!webhookUrl) return;

  const iconMap: Record<string, string> = {
    workflow_created: "🆕",
    workflow_updated: "📝",
    workflow_deleted: "🗑️",
    workflow_renamed: "✏️",
    node_added: "➕",
    node_deleted: "➖",
    node_config_updated: "⚙️",
    edge_added: "🔗",
    edge_deleted: "✂️",
    status_changed: "🔄",
    settings_updated: "⚙️",
    member_invited: "👤",
    workflow_run_started: "🚀",
  };

  const actionLabels: Record<string, string> = {
    workflow_created: "created workflow",
    workflow_updated: "updated workflow",
    workflow_deleted: "deleted workflow",
    workflow_renamed: "renamed workflow",
    node_added: "added a node",
    node_deleted: "removed a node",
    node_config_updated: "updated node config",
    edge_added: "connected nodes",
    edge_deleted: "disconnected nodes",
    status_changed: "changed status",
    settings_updated: "updated settings",
    member_invited: "invited a member",
    workflow_run_started: "started execution",
  };

  const icon = iconMap[data.action] || "📋";
  const label = actionLabels[data.action] || data.action;

  const blocks: SlackBlock[] = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `${icon} *${data.userName}* ${label}`,
      },
    },
    {
      type: "context",
      elements: [
        { type: "mrkdwn", text: `Workflow: *${data.workflowName}*` },
        ...(data.details ? [{ type: "mrkdwn", text: data.details }] : []),
      ],
    },
  ];

  try {
    await postBlocks(webhookUrl, blocks, `${icon} ${data.userName} ${label} in "${data.workflowName}"`);
  } catch {
    // Non-critical
  }
}
