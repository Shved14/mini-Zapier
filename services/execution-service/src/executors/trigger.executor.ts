import { BaseExecutor, ExecutorResult } from "./base.executor";

export class TriggerExecutor extends BaseExecutor {
  readonly type = "trigger";

  validateConfig(_config: Record<string, unknown>): void {
    // Trigger node has no required config
  }

  async execute(config: Record<string, unknown>, input: unknown): Promise<ExecutorResult> {
    // Passthrough — just forward any input data or initial payload
    return {
      success: true,
      data: config.payload ?? input ?? { triggered: true, timestamp: new Date().toISOString() },
    };
  }
}
