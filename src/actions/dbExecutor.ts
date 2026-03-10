import { prisma } from "../config/prisma";
import { ActionExecutor, ActionResult } from "./types";
import { criticalError } from "../utils/errors";

export const dbExecutor: ActionExecutor = {
  async execute(config: unknown, input: unknown): Promise<ActionResult> {
    const cfg = (config ?? {}) as {
      mode?: "raw";
      query?: string;
      params?: unknown[];
    };

    const mode = cfg.mode ?? "raw";

    if (mode === "raw") {
      if (!cfg.query) {
        throw new Error('DB action config is missing "query" for mode "raw"');
      }

      const params = cfg.params ?? (Array.isArray(input) ? input : []);

      // В тестовом проекте можно использовать небезопасный метод,
      // главное — не выполнять пользовательский ввод без валидации.
      let result;
      try {
        result = await prisma.$queryRawUnsafe(cfg.query, ...params);
      } catch (err) {
        throw criticalError("DB action failed", {
          query: cfg.query,
        });
      }

      return {
        success: true,
        output: result,
      };
    }

    // Stub для других режимов (insert/select и т.п.)
    return {
      success: true,
      output: {
        mode,
        input,
      },
    };
  },
};

