import https from "https";
import http from "http";

const EVENT_ICONS: Record<string, string> = {
  "Workflow Updated": "⚙️",
  "Workflow Created": "🆕",
  "Workflow Executed": "🚀",
  "Workflow Completed": "✅",
  "Workflow Failed": "❌",
  "Member Added": "👤",
  "Member Removed": "🚪",
  "Node Added": "➕",
  "Node Removed": "➖",
  "Nodes Connected": "🔗",
  "Nodes Disconnected": "✂️",
  "Config Updated": "⚙️",
  "Status Changed": "🔄",
};

function getIcon(event: string): string {
  return EVENT_ICONS[event] || "📋";
}

interface SlackBlock {
  type: string;
  text?: { type: string; text: string; emoji?: boolean };
  fields?: { type: string; text: string }[];
  elements?: { type: string; text: string }[];
}

function buildBlocks(event: string, details: string, extra?: Record<string, string>): SlackBlock[] {
  const icon = getIcon(event);
  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: { type: "plain_text", text: `${icon}  ${event}`, emoji: true },
    },
    {
      type: "section",
      text: { type: "mrkdwn", text: details },
    },
  ];

  if (extra && Object.keys(extra).length > 0) {
    blocks.push({
      type: "section",
      fields: Object.entries(extra).map(([k, v]) => ({
        type: "mrkdwn",
        text: `*${k}:*\n${v}`,
      })),
    });
  }

  blocks.push({
    type: "context",
    elements: [
      { type: "mrkdwn", text: `📅 ${new Date().toLocaleString("en-US", { timeZone: "Europe/Moscow" })}` },
    ],
  });

  blocks.push({ type: "divider" } as any);

  return blocks;
}

export async function sendSlackMessage(webhookUrl: string, text: string, blocks?: SlackBlock[]): Promise<void> {
  if (!webhookUrl) return;

  const body: any = { text };
  if (blocks) body.blocks = blocks;

  const payload = JSON.stringify(body);
  const url = new URL(webhookUrl);
  const transport = url.protocol === "https:" ? https : http;

  return new Promise((resolve, reject) => {
    const req = transport.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
      },
      (res) => {
        res.resume();
        res.on("end", () => resolve());
      }
    );

    req.on("error", (err) => {
      console.error("[slack] Failed to send message:", err.message);
      reject(err);
    });

    req.write(payload);
    req.end();
  });
}

export async function notifySlack(webhookUrl: string | null | undefined, event: string, details: string, extra?: Record<string, string>) {
  if (!webhookUrl) return;
  try {
    const blocks = buildBlocks(event, details, extra);
    await sendSlackMessage(webhookUrl, `${event}: ${details}`, blocks);
  } catch {
    // Non-critical — don't crash the request
  }
}
