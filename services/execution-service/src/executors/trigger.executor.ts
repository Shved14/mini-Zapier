import { BaseExecutor, ExecutorResult } from "./base.executor";

export class TriggerExecutor extends BaseExecutor {
  readonly type = "trigger";

  validateConfig(_config: Record<string, unknown>): void {
    // Trigger nodes don't require specific config
  }

  async execute(config: Record<string, unknown>, input: unknown): Promise<ExecutorResult> {
    // Trigger is a pass-through — it starts the workflow and passes config/input downstream
    return {
      success: true,
      data: config.payload || input || { triggered: true, timestamp: new Date().toISOString() },
    };
  }
}
