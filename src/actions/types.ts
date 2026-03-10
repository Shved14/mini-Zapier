export type ActionResult = {
  success: boolean;
  output: unknown;
};

export interface ActionExecutor {
  execute(config: unknown, input: unknown): Promise<ActionResult>;
}

