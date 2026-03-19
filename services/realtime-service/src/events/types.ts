export type StepStatus = "waiting" | "running" | "success" | "failed";

export interface StepEvent {
  runId: string;
  stepId: string;
  status: StepStatus;
}

export interface RunEvent {
  runId: string;
  status: StepStatus;
}

// Socket.IO event names
export const EVENTS = {
  // Client → Server
  SUBSCRIBE: "subscribe",
  UNSUBSCRIBE: "unsubscribe",

  // Server → Client
  STEP_UPDATE: "step:update",
  RUN_UPDATE: "run:update",
} as const;
