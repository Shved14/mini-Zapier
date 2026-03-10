// Placeholder for an action implementation (e.g. send email, HTTP request, etc.)

export type ActionContext = {
  workflowRunId: string;
  payload: unknown;
};

export const exampleAction = async (ctx: ActionContext) => {
  // Implement your action logic here
  return {
    ...ctx,
    result: "example-action-executed",
  };
};

