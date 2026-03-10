import axios from "axios";
import { ActionExecutor, ActionResult } from "./types";
import { env } from "../config/env";
import { interpolateTemplate } from "../utils/data";

export const telegramExecutor: ActionExecutor = {
  async execute(config: unknown, input: unknown): Promise<ActionResult> {
    const cfg = (config ?? {}) as {
      chatId?: string;
      text?: string;
      parseMode?: "MarkdownV2" | "HTML";
    };

    const token = env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      throw new Error("TELEGRAM_BOT_TOKEN is not configured");
    }

    const chatId = cfg.chatId ?? env.TELEGRAM_DEFAULT_CHAT_ID;
    if (!chatId) {
      throw new Error(
        "Telegram action has no chatId and TELEGRAM_DEFAULT_CHAT_ID is not set"
      );
    }

    const context =
      input && typeof input === "object"
        ? (input as Record<string, unknown>)
        : {};

    let text =
      cfg.text ??
      "Workflow output:\n" +
        "```json\n" +
        JSON.stringify(input, null, 2) +
        "\n```";

    text = interpolateTemplate(text, context);

    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    const response = await axios.post(url, {
      chat_id: chatId,
      text,
      parse_mode: cfg.parseMode,
    });

    if (response.status >= 400 || !response.data.ok) {
      throw new Error(
        `Telegram action failed: ${response.status} ${JSON.stringify(
          response.data
        )}`
      );
    }

    return {
      success: true,
      output: {
        messageId: response.data.result.message_id,
        chatId,
      },
    };
  },
};

