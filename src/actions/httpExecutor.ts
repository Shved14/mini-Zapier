import axios from "axios";
import { ActionExecutor, ActionResult } from "./types";

export const httpExecutor: ActionExecutor = {
  async execute(config: unknown, input: unknown): Promise<ActionResult> {
    const cfg = (config ?? {}) as {
      method?: string;
      url?: string;
      headers?: Record<string, string>;
      query?: Record<string, string | number>;
      body?: unknown;
    };

    if (!cfg.url) {
      throw new Error('HTTP action config is missing "url"');
    }

    const method = (cfg.method ?? "GET").toUpperCase();

    const response = await axios.request({
      method,
      url: cfg.url,
      headers: cfg.headers,
      params: cfg.query,
      data: cfg.body !== undefined ? cfg.body : input,
      validateStatus: () => true,
    });

    if (response.status >= 400) {
      throw new Error(
        `HTTP action failed with status ${response.status}: ${JSON.stringify(
          response.data
        )}`
      );
    }

    return {
      success: true,
      output: {
        status: response.status,
        headers: response.headers,
        data: response.data,
      },
    };
  },
};

