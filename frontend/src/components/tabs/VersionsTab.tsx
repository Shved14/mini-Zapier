import React, { useEffect, useState } from "react";
import { History, RotateCcw, Eye, EyeOff, Clock, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { versionsApi, WorkflowVersion } from "../../api/versions";

type VersionsTabProps = {
  workflowId: string;
  currentJson?: unknown;
  onRestore?: () => void | Promise<void>;
};

export const VersionsTab: React.FC<VersionsTabProps> = ({ workflowId, currentJson, onRestore }) => {
  const [versions, setVersions] = useState<WorkflowVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchVersions = async () => {
    setLoading(true);
    try {
      const data = await versionsApi.list(workflowId);
      setVersions(data);
    } catch {
      setError("Failed to load versions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVersions();
  }, [workflowId]);

  const handleRestore = async (version: WorkflowVersion) => {
    setRestoring(version.id);
    setError(null);
    try {
      await versionsApi.restore(workflowId, version.id);
      setSuccess(`Restored to version ${version.version}`);
      setTimeout(() => setSuccess(null), 4000);
      if (onRestore) await onRestore();
      fetchVersions();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to restore version");
    } finally {
      setRestoring(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  const formatRelative = (dateStr: string) => {
    const d = new Date(dateStr);
    const diffMs = Date.now() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getNodeCount = (json: unknown): number => {
    if (typeof json === "object" && json !== null && Array.isArray((json as any).nodes)) {
      return (json as any).nodes.length;
    }
    return 0;
  };

  const getEdgeCount = (json: unknown): number => {
    if (typeof json === "object" && json !== null && Array.isArray((json as any).edges)) {
      return (json as any).edges.length;
    }
    return 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4 max-h-full overflow-y-auto">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <History className="h-5 w-5 text-purple-400" />
          Version History
        </h3>
        <span className="text-sm text-gray-400">{versions.length} version{versions.length !== 1 ? "s" : ""}</span>
      </div>

      {error && (
        <div className="text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-lg px-4 py-3">{error}</div>
      )}
      {success && (
        <div className="text-sm text-emerald-400 bg-emerald-900/20 border border-emerald-800 rounded-lg px-4 py-3">{success}</div>
      )}

      {versions.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-center">
          <History className="w-12 h-12 text-gray-500 mb-3 opacity-50" />
          <p className="text-gray-400">No versions yet</p>
          <p className="text-gray-500 text-sm mt-1">Versions are created each time you save the workflow</p>
        </div>
      ) : (
        <div className="space-y-3">
          {versions.map((version, index) => {
            const isPreview = previewId === version.id;
            const nodes = getNodeCount(version.workflowJson);
            const edges = getEdgeCount(version.workflowJson);

            return (
              <div
                key={version.id}
                className="bg-slate-900/50 border border-white/5 rounded-lg hover:bg-slate-900/70 transition-colors"
              >
                <div className="flex items-center gap-4 p-4">
                  {/* Version number */}
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-sm shrink-0">
                    v{version.version}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">
                        Version {version.version}
                      </span>
                      {index === 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          latest
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatRelative(version.createdAt)}
                      </span>
                      <span>{nodes} node{nodes !== 1 ? "s" : ""}</span>
                      <span>{edges} edge{edges !== 1 ? "s" : ""}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setPreviewId(isPreview ? null : version.id)}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg border border-white/10 hover:bg-white/5 text-gray-400 hover:text-white transition-all"
                      title={isPreview ? "Hide preview" : "Preview version"}
                    >
                      {isPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      {isPreview ? "Hide" : "Preview"}
                    </button>
                    <button
                      onClick={() => handleRestore(version)}
                      disabled={restoring === version.id}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg bg-purple-600/20 text-purple-300 hover:bg-purple-600/30 border border-purple-500/20 transition-colors disabled:opacity-50"
                      title="Restore this version"
                    >
                      {restoring === version.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RotateCcw className="w-3.5 h-3.5" />
                      )}
                      Restore
                    </button>
                  </div>
                </div>

                {/* Preview */}
                {isPreview && (
                  <div className="px-4 pb-4">
                    <div className="bg-black/30 rounded-lg p-3 border border-white/5 max-h-64 overflow-auto">
                      <div className="text-xs text-gray-500 mb-2">Workflow JSON Preview</div>
                      <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono">
                        {JSON.stringify(version.workflowJson, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
