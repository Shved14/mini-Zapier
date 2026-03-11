import React, { useEffect } from "react";
import { useAppStore } from "../store/useAppStore";
import { runsApi } from "../api/runs";

type RunsPageProps = {
  onSelectRun: (id: string) => void;
};

export const RunsPage: React.FC<RunsPageProps> = ({ onSelectRun }) => {
  const { runs, loading, error, fetchRuns } = useAppStore();

  useEffect(() => {
    fetchRuns();
  }, [fetchRuns]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-base font-semibold">Workflow runs</h3>
        <button
          className="px-3 py-1.5 text-xs rounded-md border border-slate-700 hover:bg-slate-800"
          onClick={fetchRuns}
        >
          Refresh
        </button>
      </div>

      {loading && <div className="text-sm text-slate-400">Loading...</div>}
      {error && <div className="text-sm text-red-400">{error}</div>}

      <div className="grid gap-3">
        {runs.map((run) => (
          <button
            key={run.id}
            className="w-full text-left border border-slate-800 rounded-lg p-3 bg-slate-900/60 hover:border-primary-500/80 transition"
            onClick={() => onSelectRun(run.id)}
          >
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm font-medium">
                  {run.workflow?.name ?? "Workflow"}
                </div>
                <div className="text-xs text-slate-400">
                  Started: {new Date(run.startedAt).toLocaleString()}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 text-xs rounded-full ${
                    run.status === "success"
                      ? "bg-emerald-500/10 text-emerald-300"
                      : run.status === "failed"
                      ? "bg-red-500/10 text-red-300"
                      : run.status === "paused"
                      ? "bg-amber-500/10 text-amber-300"
                      : "bg-slate-700 text-slate-300"
                  }`}
                >
                  {run.status}
                </span>
                {run.status === "paused" && (
                  <button
                    className="px-2 py-1 text-xs rounded-md border border-slate-700 hover:bg-slate-800"
                    onClick={(e) => {
                      e.stopPropagation();
                      runsApi.resume(run.id).then(fetchRuns);
                    }}
                  >
                    Resume
                  </button>
                )}
              </div>
            </div>
          </button>
        ))}

        {!loading && runs.length === 0 && (
          <div className="text-sm text-slate-500">
            No runs yet. Trigger a workflow to see executions.
          </div>
        )}
      </div>
    </div>
  );
};

