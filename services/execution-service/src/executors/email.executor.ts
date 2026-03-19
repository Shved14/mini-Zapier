import nodemailer from "nodemailer";
import { BaseExecutor, ExecutorResult } from "./base.executor";

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
    const smtpHost = (config.smtpHost as string) || process.env.SMTP_HOST || "smtp.gmail.com";
    const smtpPort = (config.smtpPort as number) || Number(process.env.SMTP_PORT) || 587;
    const smtpUser = (config.smtpUser as string) || process.env.SMTP_USER || "";
    const smtpPass = (config.smtpPass as string) || process.env.SMTP_PASS || "";

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: smtpUser ? { user: smtpUser, pass: smtpPass } : undefined,
    });

    const info = await transporter.sendMail({
      from: (config.from as string) || smtpUser,
      to: config.to as string,
      subject: config.subject as string,
      html: config.body as string,
    });

    return {
      success: true,
      data: { messageId: info.messageId },
    };
  }
}
