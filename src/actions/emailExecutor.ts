import nodemailer from "nodemailer";
import { ActionExecutor, ActionResult } from "./types";
import { env } from "../config/env";
import { logger } from "../utils/logger";

let transporter: nodemailer.Transporter | null = null;

const getTransporter = () => {
  if (!transporter) {
    if (!env.SMTP_HOST) {
      logger.warn(
        "SMTP_HOST is not configured; emailExecutor will behave as stub"
      );
      return null;
    }

    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT ?? 587,
      secure: false,
      auth:
        env.SMTP_USER && env.SMTP_PASS
          ? {
              user: env.SMTP_USER,
              pass: env.SMTP_PASS,
            }
          : undefined,
    });
  }
  return transporter;
};

export const emailExecutor: ActionExecutor = {
  async execute(config: unknown, input: unknown): Promise<ActionResult> {
    const cfg = (config ?? {}) as {
      to: string;
      subject?: string;
      text?: string;
      html?: string;
    };

    const to = cfg.to;
    if (!to) {
      throw new Error('Email action config is missing "to"');
    }

    const subject = cfg.subject ?? "Workflow email notification";
    const text =
      cfg.text ??
      (typeof input === "string"
        ? input
        : JSON.stringify(input, null, 2));

    const html = cfg.html;

    const t = getTransporter();

    if (!t) {
      // Stub-режим — просто логируем и считаем успехом
      logger.info("[emailExecutor] Stub send", {
        to,
        subject,
      });
      return {
        success: true,
        output: {
          stub: true,
          to,
          subject,
        },
      };
    }

    const info = await t.sendMail({
      from: env.SMTP_FROM ?? env.SMTP_USER,
      to,
      subject,
      text,
      html,
    });

    return {
      success: true,
      output: {
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected,
      },
    };
  },
};

