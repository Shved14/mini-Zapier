import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Clock, CheckCircle, XCircle, AlertCircle, Loader2, ArrowLeft, Code, Sparkles } from "lucide-react";
import { runsApi, WorkflowRun, StepLog } from "../api/runs";
import { AiExplainModal } from "../components/AiExplainModal";

export const RunDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [run, setRun] = useState<WorkflowRun | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [explainStep, setExplainStep] = useState<StepLog | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchRun = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await runsApi.get(id);
        setRun(data);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to fetch run details");
      } finally {
        setLoading(false);
      }
    };

    fetchRun();

    // Auto-refresh for running runs
    const interval = setInterval(() => {
      if (run?.status === "running") {
        fetchRun();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [id, run?.status]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-400" />;
      case "running":
        return <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />;
      case "pending":
        return <Clock className="w-5 h-5 text-gray-400" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStepIcon = (nodeType: string) => {
    switch (nodeType) {
      case "trigger":
        return "⚡";
      case "http":
        return "🌐";
      case "email":
        return "📧";
      case "telegram":
        return "📱";
      case "db":
        return "🗄️";
      case "transform":
        return "🔄";
      default:
        return "📦";
    }
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  const getDuration = (startedAt: string | null, finishedAt: string | null) => {
    if (!startedAt) return "N/A";
    const start = new Date(startedAt);
    const end = finishedAt ? new Date(finishedAt) : new Date();
    const duration = end.getTime() - start.getTime();

    if (duration < 1000) return `${duration}ms`;
    if (duration < 60000) return `${Math.floor(duration / 1000)}s`;
    return `${Math.floor(duration / 60000)}m ${Math.floor((duration % 60000) / 1000)}s`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  if (error || !run) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <XCircle className="w-12 h-12 text-red-400 mb-4" />
        <p className="text-red-400 mb-2">Failed to load run details</p>
        <p className="text-gray-400 text-sm mb-4">{error}</p>
        <button
          onClick={() => navigate("/runs")}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          Back to Runs
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/runs")}
          className="p-2 rounded-lg hover:bg-white/10 text-gray-400 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-white">{run.workflowName}</h2>
          <p className="text-sm text-gray-400">Run ID: {run.id}</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border ${run.status === "completed"
            ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
            : run.status === "failed"
              ? "bg-red-500/10 text-red-300 border-red-500/20"
              : run.status === "running"
                ? "bg-blue-500/10 text-blue-300 border-blue-500/20"
                : "bg-gray-500/10 text-gray-300 border-gray-500/20"
          }`}>
          {getStatusIcon(run.status)}
          <span className="capitalize">{run.status}</span>
        </div>
      </div>

      {/* Run Info */}
      <div className="grid grid-cols-4 gap-4 p-4 bg-slate-900/60 rounded-lg border border-slate-800">
        <div>
          <div className="text-xs text-slate-500 mb-1">Started</div>
          <div className="text-sm text-white">{formatTime(run.startedAt)}</div>
        </div>
        <div>
          <div className="text-xs text-slate-500 mb-1">Finished</div>
          <div className="text-sm text-white">{formatTime(run.finishedAt)}</div>
        </div>
        <div>
          <div className="text-xs text-slate-500 mb-1">Duration</div>
          <div className="text-sm text-white">{getDuration(run.startedAt, run.finishedAt)}</div>
        </div>
        <div>
          <div className="text-xs text-slate-500 mb-1">Progress</div>
          <div className="text-sm text-white">{run.progress}%</div>
        </div>
      </div>

      {/* Error Display */}
      {run.error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-5 h-5 text-red-400" />
            <span className="text-red-300 font-medium">Execution Error</span>
          </div>
          <pre className="text-sm text-red-200 whitespace-pre-wrap">{run.error}</pre>
        </div>
      )}

      {/* Steps Timeline */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-purple-400" />
          Execution Steps
        </h3>

        <div className="space-y-3">
          {run.steps.map((step, index) => (
            <div key={step.id || index} className="flex gap-4 p-4 bg-slate-900/60 rounded-lg border border-slate-800">
              {/* Step indicator */}
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${step.status === "completed"
                    ? "bg-emerald-500 text-white"
                    : step.status === "failed"
                      ? "bg-red-500 text-white"
                      : step.status === "running"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-600 text-gray-300"
                  }`}>
                  {step.status === "completed" ? "✓" :
                    step.status === "failed" ? "✗" :
                      step.status === "running" ? "⟳" : getStepIcon(step.nodeType)}
                </div>
                {index < run.steps.length - 1 && (
                  <div className={`w-0.5 h-8 mt-2 ${step.status === "completed" ? "bg-emerald-500" :
                      step.status === "failed" ? "bg-red-500" : "bg-gray-600"
                    }`} />
                )}
              </div>

              {/* Step details */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-white capitalize">
                      {step.nodeType} Step
                    </div>
                    <div className="text-xs text-slate-400">
                      Node ID: {step.nodeId}
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs border ${step.status === "completed"
                      ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                      : step.status === "failed"
                        ? "bg-red-500/10 text-red-300 border-red-500/20"
                        : step.status === "running"
                          ? "bg-blue-500/10 text-blue-300 border-blue-500/20"
                          : "bg-gray-500/10 text-gray-300 border-gray-500/20"
                    }`}>
                    {step.status}
                  </div>
                </div>

                {/* Step timing */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                  {step.startedAt && (
                    <span className="font-mono">[{new Date(step.startedAt).toLocaleTimeString()}]</span>
                  )}
                  {step.duration != null && step.duration > 0 && (
                    <span className="text-slate-300 font-medium">
                      {step.duration < 1000 ? `${step.duration}ms` : `${(step.duration / 1000).toFixed(2)}s`}
                    </span>
                  )}
                  {!step.duration && step.startedAt && step.finishedAt && (
                    <span>{getDuration(step.startedAt, step.finishedAt)}</span>
                  )}
                </div>

                {/* Step error */}
                {step.error && (
                  <div className="p-2 rounded bg-red-500/10 border border-red-500/20">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1">
                        <XCircle className="w-3 h-3 text-red-400" />
                        <span className="text-xs text-red-300 font-medium">Error</span>
                      </div>
                      <button
                        onClick={() => setExplainStep(step)}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/20 transition-colors"
                      >
                        <Sparkles className="w-3 h-3" />
                        Explain error
                      </button>
                    </div>
                    <pre className="text-xs text-red-200 whitespace-pre-wrap">{step.error}</pre>
                  </div>
                )}

                {/* Step data */}
                {(step.input || step.output) && (
                  <div className="space-y-2">
                    {step.input && (
                      <details className="group">
                        <summary className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer hover:text-white">
                          <Code className="w-3 h-3" />
                          Input Data
                        </summary>
                        <pre className="mt-1 p-2 bg-black/30 rounded text-xs text-slate-300 overflow-x-auto">
                          {JSON.stringify(step.input, null, 2)}
                        </pre>
                      </details>
                    )}

                    {step.output && (
                      <details className="group">
                        <summary className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer hover:text-white">
                          <Code className="w-3 h-3" />
                          Output Data
                        </summary>
                        <pre className="mt-1 p-2 bg-black/30 rounded text-xs text-slate-300 overflow-x-auto">
                          {JSON.stringify(step.output, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Logs */}
      {run.logs && run.logs.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Code className="w-5 h-5 text-purple-400" />
            Execution Logs
          </h3>
          <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-800">
            <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono">
              {run.logs.join("\n")}
            </pre>
          </div>
        </div>
      )}

      {/* AI Explain Modal */}
      {explainStep && explainStep.error && (
        <AiExplainModal
          error={String(explainStep.error)}
          nodeType={explainStep.nodeType}
          config={{} as Record<string, unknown>}
          onClose={() => setExplainStep(null)}
        />
      )}
    </div>
  );
};
