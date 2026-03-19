import { create } from "zustand";
import { Workflow, workflowsApi } from "../api/workflows";
import { WorkflowRun, runsApi } from "../api/runs";

type AppState = {
  workflows: Workflow[];
  runs: WorkflowRun[];
  loading: boolean;
  error?: string;
  fetchWorkflows: () => Promise<void>;
  fetchRuns: () => Promise<void>;
  createWorkflow: (name: string) => Promise<Workflow>;
  deleteWorkflow: (id: string) => Promise<void>;
  runWorkflow: (id: string) => Promise<void>;
};

export const useAppStore = create<AppState>((set, get) => ({
  workflows: [],
  runs: [],
  loading: false,
  error: undefined,

  fetchWorkflows: async () => {
    set({ loading: true, error: undefined });
    try {
      const workflows = await workflowsApi.list();
      set({ workflows, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to load workflows",
        loading: false,
      });
    }
  },

  fetchRuns: async () => {
    set({ loading: true, error: undefined });
    try {
      const runs = await runsApi.list();
      set({ runs, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to load runs",
        loading: false,
      });
    }
  },

  createWorkflow: async (name: string) => {
    const workflow = await workflowsApi.create({ name });
    await get().fetchWorkflows();
    return workflow;
  },

  deleteWorkflow: async (id: string) => {
    await workflowsApi.remove(id);
    await get().fetchWorkflows();
  },

  runWorkflow: async (id: string) => {
    await workflowsApi.run(id);
  },
}));

