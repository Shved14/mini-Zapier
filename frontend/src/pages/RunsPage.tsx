import React, { useEffect, useState } from "react";

import { Clock, CheckCircle, XCircle, AlertCircle, Play, Loader2 } from "lucide-react";

import { runsApi, WorkflowRun } from "../api/runs";



type RunsPageProps = {

  onSelectRun: (id: string) => void;

};



export const RunsPage: React.FC<RunsPageProps> = ({ onSelectRun }) => {

  const [runs, setRuns] = useState<WorkflowRun[]>([]);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);



  const fetchRuns = async () => {

    setLoading(true);

    setError(null);

    try {

      const data = await runsApi.list();

      setRuns(data);

    } catch (err: any) {

      setError(err.response?.data?.message || "Failed to fetch runs");

    } finally {

      setLoading(false);

    }

  };



  useEffect(() => {

    fetchRuns();

  }, []);



  const getStatusIcon = (status: string) => {

    switch (status) {

      case "completed":

        return <CheckCircle className="w-4 h-4 text-emerald-400" />;

      case "failed":

        return <XCircle className="w-4 h-4 text-red-400" />;

      case "running":

        return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;

      case "pending":

        return <Clock className="w-4 h-4 text-gray-400" />;

      default:

        return <AlertCircle className="w-4 h-4 text-gray-400" />;

    }

  };



  const getStatusColor = (status: string) => {

    switch (status) {

      case "completed":

        return "bg-emerald-500/10 text-emerald-300 border-emerald-500/20";

      case "failed":

        return "bg-red-500/10 text-red-300 border-red-500/20";

      case "running":

        return "bg-blue-500/10 text-blue-300 border-blue-500/20";

      case "pending":

        return "bg-gray-500/10 text-gray-300 border-gray-500/20";

      default:

        return "bg-slate-700 text-slate-300";

    }

  };



  const formatTime = (dateString: string | null) => {

    if (!dateString) return "N/A";

    const date = new Date(dateString);

    return date.toLocaleString();

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



  return (

    <div className="space-y-4">

      <div className="flex justify-between items-center">

        <h3 className="text-base font-semibold theme-text flex items-center gap-2">

          <Clock className="w-5 h-5 text-purple-400" />

          Workflow Runs

        </h3>

        <button

          className="px-3 py-1.5 text-xs rounded-md border theme-border hover:bg-black/5 dark:hover:bg-white/5 theme-text-secondary transition-colors"

          onClick={fetchRuns}

          disabled={loading}

        >

          {loading ? "Refreshing..." : "Refresh"}

        </button>

      </div>



      {loading && <div className="text-sm theme-text-muted">Loading runs...</div>}

      {error && <div className="text-sm text-red-400">{error}</div>}



      <div className="grid gap-3">

        {runs.map((run) => (

          <button

            key={run.id}

            className="w-full text-left border theme-border rounded-lg p-4 theme-card hover:border-purple-500/40 transition-all group theme-transition"

            onClick={() => onSelectRun(run.id)}

          >

            <div className="flex justify-between items-start mb-2">

              <div className="flex-1">

                <div className="text-sm font-medium theme-text mb-1">

                  {run.workflowName}

                </div>

                <div className="text-xs theme-text-muted">

                  ID: {run.id.slice(0, 8)}...

                </div>

              </div>

              <div className={`flex items-center gap-2 px-2 py-1 rounded-full text-xs border ${getStatusColor(run.status)}`}>

                {getStatusIcon(run.status)}

                <span className="capitalize">{run.status}</span>

              </div>

            </div>



            <div className="grid grid-cols-3 gap-4 text-xs theme-text-secondary mb-2">

              <div>

                <div className="theme-text-muted">Started</div>

                <div>{formatTime(run.startedAt)}</div>

              </div>

              <div>

                <div className="theme-text-muted">Duration</div>

                <div>{getDuration(run.startedAt, run.finishedAt)}</div>

              </div>

              <div>

                <div className="theme-text-muted">Progress</div>

                <div>{run.progress}%</div>

              </div>

            </div>



            {/* Step progress */}

            {run.steps.length > 0 && (

              <div className="border-t theme-border pt-2">

                <div className="text-xs theme-text-muted mb-1">Steps ({run.steps.length})</div>

                <div className="flex gap-1 flex-wrap">

                  {run.steps.slice(0, 5).map((step, index) => (

                    <div

                      key={step.id || index}

                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step.status === "completed"

                        ? "bg-emerald-500 text-white"

                        : step.status === "failed"

                          ? "bg-red-500 text-white"

                          : step.status === "running"

                            ? "bg-blue-500 text-white"

                            : "bg-gray-600 text-gray-300"

                        }`}

                      title={`${step.nodeType}: ${step.status}`}

                    >

                      {step.status === "completed" ? "✓" :

                        step.status === "failed" ? "✗" :

                          step.status === "running" ? "⟳" : index + 1}

                    </div>

                  ))}

                  {run.steps.length > 5 && (

                    <div className="w-6 h-6 rounded-full bg-gray-600 text-gray-300 flex items-center justify-center text-xs">

                      +{run.steps.length - 5}

                    </div>

                  )}

                </div>

              </div>

            )}



            {run.error && (

              <div className="mt-2 p-2 rounded bg-red-500/10 border border-red-500/20 text-xs text-red-300">

                Error: {run.error}

              </div>

            )}

          </button>

        ))}



        {!loading && runs.length === 0 && (

          <div className="text-center py-8">

            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />

            <div className="text-sm theme-text-muted">

              No runs yet. Run a workflow to see executions here.

            </div>

          </div>

        )}

      </div>

    </div>

  );

};



