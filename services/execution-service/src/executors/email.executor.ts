import { BaseExecutor, ExecutorResult } from "./base.executor";
import { logger } from "../utils/logger";

export class EmailExecutor extends BaseExecutor {
  readonly type = "email";

  validateConfig(config: Record<string, unknown>): void {
    if (!config.to || typeof config.to !== "string") {
      throw new Error("email executor requires a valid 'to' string");
    }
    if (!config.subject || typeof config.subject !== "string") {
      throw new Error("email executor requires a 'subject' string");
    }
    if (!config.body || typeof config.body !== "string") {
      throw new Error("email executor requires a 'body' string");
    }
  }

  async execute(config: Record<string, unknown>, _input: unknown): Promise<ExecutorResult> {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return { success: false, error: "RESEND_API_KEY not configured" };
    }

    const from = (config.from as string) || "onboarding@resend.dev";
    const to = config.to as string;
    const subject = config.subject as string;
    const body = config.body as string;

    logger.info(`Sending email via Resend to: ${to}`);

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: [to], subject, html: body }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: `Resend API error: ${(data as any).message || response.statusText}` };
    }

    return {
      success: true,
      data: { emailId: (data as any).id, to, subject },
    };
  }
}
