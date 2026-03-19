import React, { useEffect, useState } from "react";
import { Activity, RefreshCw } from "lucide-react";
import { activityApi, ActivityLog } from "../../api/activity";

const actionLabels: Record<string, string> = {
  workflow_created: "created the workflow",
  workflow_renamed: "renamed the workflow",
  workflow_updated: "updated the workflow",
  workflow_executed: "executed the workflow",
  workflow_deleted: "deleted the workflow",
  status_changed: "changed workflow status",
  settings_updated: "updated settings",
  node_added: "added a node",
  node_removed: "removed a node",
  node_connected: "connected nodes",
  node_config_updated: "updated node config",
  member_invited: "invited a member",
  member_joined: "joined the workflow",
  member_left: "left the workflow",
  member_removed: "removed a member",
  invite_accepted: "accepted the invite",
  workflow_run: "ran the workflow",
};

type LogsTabProps = {
  workflowId: string;
};

export const LogsTab: React.FC<LogsTabProps> = ({ workflowId }) => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await activityApi.list(workflowId);
      setLogs(data);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [workflowId]);

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Activity className="h-5 w-5 text-purple-400" />
          Activity Logs
        </h3>
        <button
          onClick={fetchLogs}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-white/10 hover:bg-white/5 text-gray-400 hover:text-white transition-all"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {loading && <div className="text-sm text-gray-400 animate-pulse">Loading logs...</div>}

      {!loading && logs.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Activity className="h-8 w-8 mx-auto mb-3 opacity-50" />
          <p>No activity yet</p>
        </div>
      )}

      <div className="space-y-1">
        {logs.map((log) => {
          const time = new Date(log.createdAt);
          const timeStr = time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          const dateStr = time.toLocaleDateString();
          const label = actionLabels[log.action] || log.action;
          const meta = log.metadata as Record<string, unknown> | null;

          return (
            <div
              key={log.id}
              className="flex items-start gap-3 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors group"
            >
              <div className="shrink-0 w-2 h-2 mt-2 rounded-full bg-purple-500/60 group-hover:bg-purple-400 transition-colors" />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-sm text-white font-medium truncate">
                    {(log as any).user?.name || (log as any).user?.email || log.userId.slice(0, 8) + "..."}
                  </span>
                  <span className="text-sm text-gray-400">{label}</span>
                  {meta && meta.name != null && (
                    <span className="text-sm text-purple-300">&quot;{String(meta.name)}&quot;</span>
                  )}
                  {meta && meta.email != null && (
                    <span className="text-sm text-blue-300">{String(meta.email)}</span>
                  )}
                  {meta && meta.status != null && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${String(meta.status) === "active" || meta.isActive === true
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-amber-500/20 text-amber-300"
                      }`}>{String(meta.status ?? (meta.isActive ? "active" : "paused"))}</span>
                  )}
                  {meta && meta.isActive !== undefined && meta.status == null && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${meta.isActive
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-amber-500/20 text-amber-300"
                      }`}>{meta.isActive ? "active" : "paused"}</span>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {dateStr} at {timeStr}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
