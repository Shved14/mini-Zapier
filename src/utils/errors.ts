export type ErrorKind = "retryable" | "nonRetryable" | "critical";

export class WorkflowError extends Error {
  kind: ErrorKind;
  meta?: Record<string, unknown>;

  constructor(message: string, kind: ErrorKind, meta?: Record<string, unknown>) {
    super(message);
    this.kind = kind;
    this.meta = meta;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export const retryableError = (message: string, meta?: Record<string, unknown>) =>
  new WorkflowError(message, "retryable", meta);

export const nonRetryableError = (
  message: string,
  meta?: Record<string, unknown>
) => new WorkflowError(message, "nonRetryable", meta);

export const criticalError = (message: string, meta?: Record<string, unknown>) =>
  new WorkflowError(message, "critical", meta);

