import React, { useEffect, useState } from "react";
import { useAppStore } from "../store/useAppStore";
import { workflowsApi, Workflow } from "../api/workflows";
import { WorkflowEditor } from "../components/WorkflowEditor";

export const WorkflowsPage: React.FC = () => {
  const { workflows, loading, error, fetchWorkflows } = useAppStore();
  const [editing, setEditing] = useState<Workflow | null>(null);
  const [editingJson, setEditingJson] = useState<any | undefined>(undefined);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  const openEditor = async (wf: Workflow) => {
    try {
      const full = await workflowsApi.get(wf.id);
      // full may contain latest workflowJson via backend; for now, assume triggerConfig.workflowJson not returned
      // so we just leave initialWorkflowJson undefined or extend API later
      setEditing(wf);
      setEditingJson((full as any).workflowJson ?? undefined);
    } catch {
      setEditing(wf);
      setEditingJson(undefined);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-base font-semibold">Workflows</h3>
        <button
          className="px-3 py-1.5 text-sm rounded-md bg-primary-600 hover:bg-primary-700"
          onClick={() =>
            workflowsApi
              .create({
                name: "New workflow",
                triggerType: "webhook",
              })
              .then(fetchWorkflows)
          }
        >
          + New workflow
        </button>
      </div>

      {loading && <div className="text-sm text-slate-400">Loading...</div>}
      {error && <div className="text-sm text-red-400">{error}</div>}

      <div className="grid gap-3">
        {workflows.map((wf) => (
          <div
            key={wf.id}
            className="border border-slate-800 rounded-lg p-4 bg-slate-900/60 flex justify-between items-center"
          >
            <div>
              <div className="font-medium">{wf.name}</div>
              <div className="text-xs text-slate-400">
                Trigger: {wf.triggerType} • Created:{" "}
                {new Date(wf.createdAt).toLocaleString()}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 text-xs rounded-full ${
                  wf.isActive
                    ? "bg-emerald-500/10 text-emerald-300"
                    : "bg-slate-700 text-slate-300"
                }`}
              >
                {wf.isActive ? "Active" : "Inactive"}
              </span>
              <button
                className="px-2 py-1 text-xs rounded-md border border-slate-700 hover:bg-slate-800"
                onClick={() => workflowsApi.run(wf.id).then(() => {})}
              >
                Run
              </button>
              <button
                className="px-2 py-1 text-xs rounded-md border border-slate-700 hover:bg-slate-800"
                onClick={() => openEditor(wf)}
              >
                Edit
              </button>
            </div>
          </div>
        ))}

        {!loading && workflows.length === 0 && (
          <div className="text-sm text-slate-500">
            No workflows yet. Create your first one.
          </div>
        )}
      </div>
      {editing && (
        <WorkflowEditor
          workflow={editing}
          initialWorkflowJson={editingJson}
          onClose={() => {
            setEditing(null);
            setEditingJson(undefined);
            fetchWorkflows();
          }}
        />
      )}
    </div>
  );
};

