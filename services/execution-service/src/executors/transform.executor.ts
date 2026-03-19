import { BaseExecutor, ExecutorResult } from "./base.executor";

export class TransformExecutor extends BaseExecutor {
  readonly type = "transform";

  validateConfig(config: Record<string, unknown>): void {
    if (!config.expression || typeof config.expression !== "string") {
      throw new Error("transform executor requires an 'expression' string");
    }
  }

  async execute(config: Record<string, unknown>, input: unknown): Promise<ExecutorResult> {
    const expression = config.expression as string;
    const inputData = (typeof input === "object" && input !== null) ? input as Record<string, unknown> : {};

    // Supported operations: pick, omit, rename, template, map
    const operation = (config.operation as string) || "template";

    switch (operation) {
      case "pick": {
        const keys = (config.keys as string[]) || [];
        const result: Record<string, unknown> = {};
        for (const key of keys) {
          if (key in inputData) {
            result[key] = inputData[key];
          }
        }
        return { success: true, data: result };
      }

      case "omit": {
        const keys = new Set((config.keys as string[]) || []);
        const result: Record<string, unknown> = {};
        for (const [key, val] of Object.entries(inputData)) {
          if (!keys.has(key)) {
            result[key] = val;
          }
        }
        return { success: true, data: result };
      }

      case "rename": {
        const mapping = (config.mapping as Record<string, string>) || {};
        const result: Record<string, unknown> = { ...inputData };
        for (const [oldKey, newKey] of Object.entries(mapping)) {
          if (oldKey in result) {
            result[newKey] = result[oldKey];
            delete result[oldKey];
          }
        }
        return { success: true, data: result };
      }

      case "template": {
        const output = expression.replace(/\{\{(\w+)\}\}/g, (_match, key) => {
          const val = inputData[key];
          return val !== undefined ? String(val) : `{{${key}}}`;
        });
        return { success: true, data: { result: output } };
      }

      case "map": {
        const result: Record<string, unknown> = {};
        const mapping = (config.mapping as Record<string, string>) || {};
        for (const [outputKey, inputPath] of Object.entries(mapping)) {
          result[outputKey] = inputData[inputPath] ?? null;
        }
        return { success: true, data: result };
      }

      default:
        return { success: false, error: `Unknown transform operation: ${operation}` };
    }
  }
}
