import { ActionExecutor, ActionResult } from "./types";
import { getByPath } from "../utils/data";

export const transformExecutor: ActionExecutor = {
  async execute(config: unknown, input: unknown): Promise<ActionResult> {
    const cfg = (config ?? {}) as {
      mode?: "pick" | "map";
      fields?: string[];
      map?: Record<string, string>;
      mapping?: Record<string, string>;
    };

    const mode = cfg.mode ?? "pick";

    if (input === null || typeof input !== "object") {
      return { success: true, output: input };
    }

    if (mode === "pick" && Array.isArray(cfg.fields)) {
      const out: Record<string, unknown> = {};
      for (const key of cfg.fields) {
        const value = getByPath(input, key);
        if (value !== undefined) {
          out[key] = value;
        }
      }
      return { success: true, output: out };
    }

    if (mode === "map" && (cfg.map || cfg.mapping)) {
      const mapping = cfg.map ?? cfg.mapping ?? {};
      const out: Record<string, unknown> = {};
      for (const [outKey, inPath] of Object.entries(mapping)) {
        out[outKey] = getByPath(input, inPath);
      }
      return { success: true, output: out };
    }

    return { success: true, output: input };
  },
};

