import https from "https";
import http from "http";

export async function sendSlackMessage(webhookUrl: string, text: string): Promise<void> {
  if (!webhookUrl) return;

  const payload = JSON.stringify({ text });
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

export async function notifySlack(webhookUrl: string | null | undefined, event: string, details: string) {
  if (!webhookUrl) return;
  try {
    await sendSlackMessage(webhookUrl, `*${event}*\n${details}`);
  } catch {
    // Non-critical — don't crash the request
  }
}
