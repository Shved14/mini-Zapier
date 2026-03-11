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
};

export const useAppStore = create<AppState>((set) => ({
  workflows: [],
  runs: [],
  loading: false,
  error: undefined,
  fetchWorkflows: async () => {
    set({ loading: true, error: undefined });
    try {
      const data = await workflowsApi.list();
      set({ workflows: data.items, loading: false });
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
      const data = await runsApi.list();
      set({ runs: data.items, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to load runs",
        loading: false,
      });
    }
  },
}));

