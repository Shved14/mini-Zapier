import { ActionResult } from "./types";
import { httpExecutor } from "./httpExecutor";
import { transformExecutor } from "./transformExecutor";
import { telegramExecutor } from "./telegramExecutor";
import { emailExecutor } from "./emailExecutor";
import { dbExecutor } from "./dbExecutor";

export type ActionExecutorFn = (
  config: unknown,
  input: unknown
) => Promise<ActionResult>;

export const actionRegistry: Record<string, ActionExecutorFn> = {
  http: (config, input) => httpExecutor.execute(config, input),
  transform: (config, input) => transformExecutor.execute(config, input),
  telegram: (config, input) => telegramExecutor.execute(config, input),
  email: (config, input) => emailExecutor.execute(config, input),
  db: (config, input) => dbExecutor.execute(config, input),
};

