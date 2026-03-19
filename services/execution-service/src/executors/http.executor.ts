import axios from "axios";
import { BaseExecutor, ExecutorResult } from "./base.executor";

export class HttpExecutor extends BaseExecutor {
  readonly type = "http";

  validateConfig(config: Record<string, unknown>): void {
    if (!config.url || typeof config.url !== "string") {
      throw new Error("http executor requires a valid 'url' string");
    }
    const method = (config.method as string || "GET").toUpperCase();
    const allowed = ["GET", "POST", "PUT", "PATCH", "DELETE"];
    if (!allowed.includes(method)) {
      throw new Error(`http executor method must be one of: ${allowed.join(", ")}`);
    }
  }

  async execute(config: Record<string, unknown>, input: unknown): Promise<ExecutorResult> {
    const url = config.url as string;
    const method = ((config.method as string) || "GET").toUpperCase();
    const headers = (config.headers as Record<string, string>) || {};
    const timeout = (config.timeout as number) || 30000;

    let body = config.body ?? input;

    const response = await axios({
      url,
      method,
      headers,
      data: method !== "GET" ? body : undefined,
      timeout,
    });

    return {
      success: true,
      data: {
        status: response.status,
        headers: response.headers,
        body: response.data,
      },
    };
  }
}
