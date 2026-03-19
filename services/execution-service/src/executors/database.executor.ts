import axios from "axios";
import { BaseExecutor, ExecutorResult } from "./base.executor";

export class DatabaseExecutor extends BaseExecutor {
  readonly type = "database";

  validateConfig(config: Record<string, unknown>): void {
    if (!config.operation || typeof config.operation !== "string") {
      throw new Error("database executor requires an 'operation' string (query|insert|update|delete)");
    }
    const allowed = ["query", "insert", "update", "delete"];
    if (!allowed.includes(config.operation as string)) {
      throw new Error(`database executor operation must be one of: ${allowed.join(", ")}`);
    }
    if (!config.connectionString || typeof config.connectionString !== "string") {
      throw new Error("database executor requires a 'connectionString'");
    }
    if (!config.sql || typeof config.sql !== "string") {
      throw new Error("database executor requires a 'sql' string");
    }
  }

  async execute(config: Record<string, unknown>, _input: unknown): Promise<ExecutorResult> {
    // Delegates to an internal DB proxy endpoint for security isolation.
    // In production, replace with a direct pg/mysql client or a dedicated DB proxy service.
    const proxyUrl = process.env.DB_PROXY_URL;

    if (!proxyUrl) {
      return {
        success: false,
        error: "DB_PROXY_URL environment variable is not configured",
      };
    }

    const response = await axios.post(proxyUrl, {
      connectionString: config.connectionString,
      operation: config.operation,
      sql: config.sql,
      params: config.params || [],
    });

    return {
      success: true,
      data: response.data,
    };
  }
}
