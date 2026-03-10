import axios from "axios";
import { ActionExecutor, ActionResult } from "./types";
import { nonRetryableError, retryableError } from "../utils/errors";

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

    let response;
    try {
      response = await axios.request({
        method,
        url: cfg.url,
        headers: cfg.headers,
        params: cfg.query,
        data: cfg.body !== undefined ? cfg.body : input,
        validateStatus: () => true,
      });
    } catch (err) {
      // сетевые/таймауты
      throw retryableError("HTTP action network error", {
        url: cfg.url,
        method,
      });
    }

    if (response.status >= 500) {
      throw retryableError(`HTTP action failed with status ${response.status}`, {
        status: response.status,
        url: cfg.url,
        method,
      });
    }

    if (response.status >= 400) {
      throw nonRetryableError(
        `HTTP action failed with status ${response.status}`,
        {
          status: response.status,
          url: cfg.url,
          method,
          data: response.data,
        }
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

