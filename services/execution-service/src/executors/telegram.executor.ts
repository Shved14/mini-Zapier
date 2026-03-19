import axios from "axios";
import { BaseExecutor, ExecutorResult } from "./base.executor";

export class TelegramExecutor extends BaseExecutor {
  readonly type = "telegram";

  validateConfig(config: Record<string, unknown>): void {
    if (!config.botToken || typeof config.botToken !== "string") {
      throw new Error("telegram executor requires a valid 'botToken' string");
    }
    if (!config.chatId) {
      throw new Error("telegram executor requires a 'chatId'");
    }
    if (!config.text || typeof config.text !== "string") {
      throw new Error("telegram executor requires a 'text' string");
    }
  }

  async execute(config: Record<string, unknown>, input: unknown): Promise<ExecutorResult> {
    const botToken = config.botToken as string;
    const chatId = config.chatId as string | number;
    let text = config.text as string;

    if (typeof input === "object" && input !== null) {
      text = text.replace(/\{\{(\w+)\}\}/g, (_match, key) => {
        const val = (input as Record<string, unknown>)[key];
        return val !== undefined ? String(val) : `{{${key}}}`;
      });
    }

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await axios.post(url, {
      chat_id: chatId,
      text,
      parse_mode: config.parseMode || "HTML",
    });

    return {
      success: true,
      data: response.data,
    };
  }
}
