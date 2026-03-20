import React, { useEffect, useState } from "react";
import { Clock, User, Settings, Zap, Link2, Trash2, Plus, Play, Pause, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { workflowsApi } from "../api/workflows";

interface ActivityLog {
  id: string;
  userId: string;
  workflowId: string;
  action: string;
  metadata: any;
  createdAt: string;
  message: string;
  user?: { id: string; email: string; name?: string | null };
}

interface LogsTabProps {
  workflowId: string;
}

export const LogsTab: React.FC<LogsTabProps> = ({ workflowId }) => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Inject custom scrollbar styles
  useEffect(() => {
    const styleId = 'custom-scrollbar-styles';
    let styleElement = document.getElementById(styleId);

    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      styleElement.textContent = `
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px !important;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05) !important;
          border-radius: 4px !important;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(147, 51, 234, 0.5) !important;
          border-radius: 4px !important;
          border: 1px solid rgba(147, 51, 234, 0.3) !important;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(147, 51, 234, 0.7) !important;
          border: 1px solid rgba(147, 51, 234, 0.5) !important;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:active {
          background: rgba(147, 51, 234, 0.9) !important;
          border: 1px solid rgba(147, 51, 234, 0.7) !important;
        }
        
        /* Firefox scrollbar styles */
        .custom-scrollbar {
          scrollbar-width: thin !important;
          scrollbar-color: rgba(147, 51, 234, 0.5) rgba(255, 255, 255, 0.05) !important;
        }
        
        .custom-scrollbar:hover {
          scrollbar-color: rgba(147, 51, 234, 0.7) rgba(255, 255, 255, 0.05) !important;
        }
        
        /* Override Tailwind scrollbar styles */
        .custom-scrollbar {
          scrollbar-width: thin !important;
          -ms-overflow-style: none !important;  /* IE and Edge */
        }
      `;
      document.head.appendChild(styleElement);
    }

    return () => {
      if (styleElement && document.head.contains(styleElement)) {
        document.head.removeChild(styleElement);
      }
    };
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [workflowId]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await workflowsApi.getLogs(workflowId);
      setLogs(response.logs || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load logs");
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "workflow_created":
      case "workflow_renamed":
      case "workflow_updated":
      case "workflow_deleted":
        return <Settings className="w-4 h-4" />;
      case "node_added":
        return <Plus className="w-4 h-4" />;
      case "node_deleted":
        return <Trash2 className="w-4 h-4" />;
      case "node_updated":
      case "node_config_updated":
        return <Settings className="w-4 h-4" />;
      case "edge_added":
        return <Link2 className="w-4 h-4" />;
      case "edge_deleted":
        return <XCircle className="w-4 h-4" />;
      case "workflow_run_started":
        return <Play className="w-4 h-4" />;
      case "workflow_run_completed":
        return <CheckCircle className="w-4 h-4" />;
      case "workflow_run_failed":
        return <XCircle className="w-4 h-4" />;
      case "status_changed":
        return <Pause className="w-4 h-4" />;
      case "member_invited":
        return <User className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "workflow_created":
      case "node_added":
      case "edge_added":
      case "workflow_run_started":
      case "workflow_run_completed":
      case "member_invited":
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      case "workflow_deleted":
      case "node_deleted":
      case "edge_deleted":
      case "workflow_run_failed":
        return "text-red-400 bg-red-500/10 border-red-500/20";
      case "workflow_renamed":
      case "workflow_updated":
      case "node_updated":
      case "node_config_updated":
      case "status_changed":
      case "settings_updated":
        return "text-blue-400 bg-blue-500/10 border-blue-500/20";
      default:
        return "text-gray-400 bg-gray-500/10 border-gray-500/20";
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <p className="text-red-400 mb-2">Failed to load logs</p>
        <p className="text-gray-400 text-sm mb-4">{error}</p>
        <button
          onClick={fetchLogs}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Clock className="w-12 h-12 text-gray-400 mb-4" />
        <p className="text-gray-400 mb-2">No activity yet</p>
        <p className="text-gray-500 text-sm">Actions will appear here as you work with this workflow</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6 px-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-purple-400" />
          Activity Log
        </h3>
        <span className="text-sm text-gray-400">{logs.length} actions</span>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto mx-4 pr-2 custom-scrollbar">
        {logs.map((log, index) => (
          <div
            key={log.id}
            className="flex items-start gap-3 p-4 bg-slate-900/50 border border-white/5 rounded-lg hover:bg-slate-900/70 transition-colors"
          >
            <div className={`p-2 rounded-lg border ${getActionColor(log.action)}`}>
              {getActionIcon(log.action)}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-white text-sm mb-1">{log.message}</p>
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {log.user?.email || log.user?.name || log.userId.slice(0, 8) + "..."}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTime(log.createdAt)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
