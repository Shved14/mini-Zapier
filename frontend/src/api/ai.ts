import { api } from "./client";

export interface AiExplanation {
  explanation: string;
  suggestedFix: string;
}

export interface TestNodeResult {
  success: boolean;
  data?: unknown;
  error?: string;
  durationMs: number;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  nodes: Array<{
    id: string;
    type: string;
    config: Record<string, unknown>;
    position: { x: number; y: number };
  }>;
  edges: Array<{ source: string; target: string }>;
}

export const aiApi = {
  async explainError(error: string, nodeType: string, config: Record<string, unknown>): Promise<AiExplanation> {
    const res = await api.post<AiExplanation>("/explain-error", { error, nodeType, config });
    return res.data;
  },
};

export const nodesApi = {
  async testNode(node: { type: string; config: Record<string, unknown> }, input?: unknown): Promise<TestNodeResult> {
    const res = await api.post<TestNodeResult>("/test-node", { node, input });
    return res.data;
  },
};

export const templatesApi = {
  async list(): Promise<WorkflowTemplate[]> {
    const res = await api.get<WorkflowTemplate[]>("/templates");
    return res.data;
  },
};
