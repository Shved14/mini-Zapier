import React, { useEffect, useState } from "react";
import { useAppStore } from "../store/useAppStore";
import { workflowsApi, Workflow } from "../api/workflows";
import { WorkflowEditor } from "../components/WorkflowEditor";

export const WorkflowsPage: React.FC = () => {
  const { workflows, loading, error, fetchWorkflows } = useAppStore();
  const [editing, setEditing] = useState<Workflow | null>(null);
  const [editingJson, setEditingJson] = useState<any | undefined>(undefined);
  const [deleting, setDeleting] = useState<Workflow | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);

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
                className={`px-2 py-0.5 text-xs rounded-full ${wf.isActive
                    ? "bg-emerald-500/10 text-emerald-300"
                    : "bg-slate-700 text-slate-300"
                  }`}
              >
                {wf.isActive ? "Active" : "Inactive"}
              </span>
              <button
                className="px-2 py-1 text-xs rounded-md border border-slate-700 hover:bg-slate-800"
                onClick={() => workflowsApi.run(wf.id).then(() => { })}
              >
                Run
              </button>
              <button
                className="px-2 py-1 text-xs rounded-md border border-slate-700 hover:bg-slate-800"
                onClick={() => openEditor(wf)}
              >
                Edit
              </button>
              <button
                className="px-2 py-1 text-xs rounded-md border border-red-500/60 text-red-200 hover:bg-red-500/10"
                onClick={() => setDeleting(wf)}
              >
                Delete
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
      {deleting && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-950 p-5 shadow-xl">
            <h4 className="text-sm font-semibold mb-2 text-slate-100">
              Delete this workflow?
            </h4>
            <p className="text-xs text-slate-400 mb-4">
              You are about to delete{" "}
              <span className="font-medium text-slate-100">
                {deleting.name}
              </span>
              . This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 text-xs">
              <button
                className="px-3 py-1.5 rounded-md border border-slate-700 hover:bg-slate-800"
                onClick={() => setDeleting(null)}
                disabled={deletingLoading}
              >
                Cancel
              </button>
              <button
                className="px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-700 disabled:opacity-60"
                onClick={async () => {
                  if (!deleting) return;
                  setDeletingLoading(true);
                  try {
                    await workflowsApi.remove(deleting.id);
                    await fetchWorkflows();
                    setDeleting(null);
                  } finally {
                    setDeletingLoading(false);
                  }
                }}
                disabled={deletingLoading}
              >
                {deletingLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

