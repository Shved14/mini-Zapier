import React, { useEffect, useState } from "react";
import { runsApi, WorkflowRun } from "../api/runs";

export const StatsPage: React.FC = () => {
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    runsApi
      .list()
      .then((data) => setRuns(data))
      .catch(() => setRuns([]))
      .finally(() => setLoading(false));
  }, []);

  const total = runs.length;
  const success = runs.filter((r) => r.status === "success").length;
  const failed = runs.filter((r) => r.status === "failed").length;
  const paused = runs.filter((r) => r.status === "paused").length;

  return (
    <div className="space-y-6">
      <h3 className="text-base font-semibold">Statistics</h3>
      {loading && <div className="text-sm text-slate-400">Loading...</div>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border border-slate-800 rounded-lg p-4 bg-slate-900/60">
          <div className="text-xs text-slate-400">Total runs</div>
          <div className="text-2xl font-semibold">{total}</div>
        </div>
        <div className="border border-slate-800 rounded-lg p-4 bg-slate-900/60">
          <div className="text-xs text-slate-400">Successful</div>
          <div className="text-2xl font-semibold text-emerald-300">
            {success}
          </div>
        </div>
        <div className="border border-slate-800 rounded-lg p-4 bg-slate-900/60">
          <div className="text-xs text-slate-400">Failed</div>
          <div className="text-2xl font-semibold text-red-300">{failed}</div>
        </div>
        <div className="border border-slate-800 rounded-lg p-4 bg-slate-900/60">
          <div className="text-xs text-slate-400">Paused</div>
          <div className="text-2xl font-semibold text-amber-300">
            {paused}
          </div>
        </div>
      </div>
    </div>
  );
};

