import React, { useEffect, useState } from "react";
import { runsApi, WorkflowRun, StepLog } from "../api/runs";

type RunDetailsPageProps = {
  runId?: string | null;
};

export const RunDetailsPage: React.FC<RunDetailsPageProps> = ({ runId }) => {
  const [run, setRun] = useState<WorkflowRun | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (!runId) return;
    setLoading(true);
    setError(undefined);
    runsApi
      .get(runId)
      .then((data) => setRun(data))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load run")
      )
      .finally(() => setLoading(false));
  }, [runId]);

  if (!runId) {
    return (
      <div className="text-sm text-slate-500">
        Select a run from the list to see details.
      </div>
    );
  }

  if (loading) {
    return <div className="text-sm text-slate-400">Loading run...</div>;

  }

  if (error) {
    return <div className="text-sm text-red-400">{error}</div>;
  }

  if (!run) {
    return null;
  }

  const renderStep = (step: StepLog) => {
    const durationMs =
      step.startedAt && step.finishedAt
        ? new Date(step.finishedAt).getTime() -
        new Date(step.startedAt).getTime()
        : undefined;

    return (
      <div
        key={step.id}
        className="border border-slate-800 rounded-lg p-3 bg-slate-900/60"
      >
        <div className="flex justify-between items-center">
          <div>
            <div className="text-sm font-medium">
              {step.stepType} ({step.stepId})
            </div>
            <div className="text-xs text-slate-400">
              {new Date(step.startedAt).toLocaleTimeString()}{" "}
              {durationMs !== undefined &&
                `• ${durationMs.toFixed(0)} ms`}
            </div>
          </div>
          <span
            className={`px-2 py-0.5 text-xs rounded-full ${step.status === "success"
                ? "bg-emerald-500/10 text-emerald-300"
                : step.status === "failed"
                  ? "bg-red-500/10 text-red-300"
                  : "bg-slate-700 text-slate-300"
              }`}
          >
            {step.status}
          </span>
        </div>
        {step.error && (
          <div className="mt-2 text-xs text-red-300">
            Error: {step.error}
          </div>
        )}
        <details className="mt-2 text-xs">
          <summary className="cursor-pointer text-slate-300">
            Input / Output
          </summary>
          <div className="mt-1 grid grid-cols-2 gap-2">
            <pre className="bg-slate-950/60 border border-slate-800 rounded p-2 overflow-x-auto">
              {JSON.stringify(step.input, null, 2)}
            </pre>
            <pre className="bg-slate-950/60 border border-slate-800 rounded p-2 overflow-x-auto">
              {JSON.stringify(step.output, null, 2)}
            </pre>
          </div>
        </details>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold">
          Run details #{run.id.slice(0, 6)}
        </h3>
        <div className="text-xs text-slate-400">
          Workflow: {run.workflow?.name ?? run.workflowId} • Status:{" "}
          {run.status}
        </div>
      </div>
      <div className="space-y-2">
        {((run as any).steps ?? run.stepLogs ?? []).map(renderStep)}
        {(!((run as any).steps?.length || run.stepLogs?.length)) && (
          <div className="text-sm text-slate-500">
            No step logs for this run yet.
          </div>
        )}
      </div>
    </div>
  );
};

