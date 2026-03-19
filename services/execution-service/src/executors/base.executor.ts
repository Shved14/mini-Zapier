import { logger } from "../utils/logger";

export interface ExecutorResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

export abstract class BaseExecutor {
  abstract readonly type: string;

  abstract validateConfig(config: Record<string, unknown>): void;
  abstract execute(config: Record<string, unknown>, input: unknown): Promise<ExecutorResult>;

  async run(config: Record<string, unknown>, input: unknown): Promise<ExecutorResult> {
    logger.info(`Executing node type: ${this.type}`);

    try {
      this.validateConfig(config);
    } catch (err: any) {
      logger.error(`Config validation failed for ${this.type}: ${err.message}`);
      return { success: false, error: `Config validation: ${err.message}` };
    }

    try {
      const result = await this.execute(config, input);
      logger.info(`Node ${this.type} completed`, { success: result.success });
      return result;
    } catch (err: any) {
      logger.error(`Node ${this.type} execution failed: ${err.message}`);
      return { success: false, error: err.message };
    }
  }
}
