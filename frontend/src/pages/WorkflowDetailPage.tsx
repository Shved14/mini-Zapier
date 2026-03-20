import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Play, Pause, Trash2, Save, Check, X,
  FileText, Users, Settings, Activity,
} from "lucide-react";
import { workflowsApi, Workflow } from "../api/workflows";
import { WorkflowEditor } from "../components/WorkflowEditor";
import { MembersTab } from "../components/tabs/MembersTab";
import { LogsTab } from "../components/LogsTab";
import { SettingsTab } from "../components/tabs/SettingsTab";
import { useAuthStore } from "../store/useAuthStore";

const tabs = [
  { id: "editor", label: "Editor", icon: FileText },
  { id: "logs", label: "Logs", icon: Activity },
  { id: "members", label: "Members", icon: Users },
  { id: "settings", label: "Settings", icon: Settings },
] as const;

type TabId = (typeof tabs)[number]["id"];

export const WorkflowDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("editor");

  // Inline name editing
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [nameSaving, setNameSaving] = useState(false);

  // Delete confirmation
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchWorkflow = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const wf = await workflowsApi.get(id);
      setWorkflow(wf);
      setNameValue(wf.name);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load workflow");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchWorkflow();
  }, [fetchWorkflow]);

  const handleNameSave = async () => {
    if (!workflow || !nameValue.trim() || nameValue === workflow.name) {
      setEditingName(false);
      return;
    }
    setNameSaving(true);
    try {
      const updated = await workflowsApi.update(workflow.id, { name: nameValue.trim() });
      setWorkflow((prev) => prev ? { ...prev, name: updated.name } : prev);
      setEditingName(false);
    } catch {
      setNameValue(workflow.name);
    } finally {
      setNameSaving(false);
    }
  };

  const handleStatusToggle = async () => {
    if (!workflow) return;
    const newStatus = (workflow.status === "active" || workflow.isActive) ? "paused" : "active";
    try {
      const updated = await workflowsApi.patchStatus(workflow.id, newStatus);
      setWorkflow((prev) => prev ? { ...prev, status: updated.status, isActive: updated.status === "active" } : prev);
    } catch { /* silently fail */ }
  };

  // Determine user's role
  const myRole = (() => {
    if (!workflow || !user) return "viewer";
    if (workflow.userId === user.id) return "owner";
    const member = (workflow as any).members?.find((m: any) => m.userId === user.id);
    return member?.role || "viewer";
  })();

  const canEdit = myRole === "owner" || myRole === "editor";
  const canDelete = myRole === "owner";

  const handleRun = async () => {
    if (!workflow) return;
    try {
      await workflowsApi.run(workflow.id);
    } catch { /* silently fail */ }
  };

  const handleDelete = async () => {
    if (!workflow) return;
    setDeleting(true);
    try {
      await workflowsApi.remove(workflow.id);
      navigate("/workflows", { replace: true });
    } catch {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <div className="text-gray-400 animate-pulse">Loading workflow...</div>
      </div>
    );
  }

  if (error || !workflow) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 gap-4">
        <div className="text-red-400">{error || "Workflow not found"}</div>
        <button
          onClick={() => navigate("/workflows")}
          className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" /> Back to workflows
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full -m-6">
      {/* Top bar */}
      <div className="px-6 py-4 border-b border-white/10 bg-slate-900/40 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={() => navigate("/workflows")}
            className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          {/* Editable name */}
          {editingName ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleNameSave();
                  if (e.key === "Escape") { setEditingName(false); setNameValue(workflow.name); }
                }}
                onBlur={handleNameSave}
                disabled={nameSaving}
                className="bg-white/5 border border-white/20 rounded-lg px-3 py-1.5 text-lg font-semibold text-white focus:outline-none focus:border-purple-500 min-w-[200px]"
              />
              <button onClick={handleNameSave} className="p-1 text-emerald-400 hover:text-emerald-300"><Check className="h-4 w-4" /></button>
              <button onClick={() => { setEditingName(false); setNameValue(workflow.name); }} className="p-1 text-gray-400 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
          ) : (
            <h1
              onClick={() => setEditingName(true)}
              className="text-lg font-semibold text-white truncate cursor-pointer hover:text-purple-300 transition-colors"
              title="Click to rename"
            >
              {workflow.name}
            </h1>
          )}

          {/* Status badge */}
          <span className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium ${workflow.isActive
            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
            : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
            }`}>
            {workflow.isActive ? "Active" : "Paused"}
          </span>

          {/* Role badge */}
          <span className="shrink-0 px-2 py-0.5 rounded-full text-xs bg-white/5 text-gray-400 border border-white/10">
            {myRole}
          </span>
        </div>

        {/* Actions — role-based */}
        <div className="flex items-center gap-2 shrink-0">
          {canEdit && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRun}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 text-sm transition-all"
            >
              <Play className="h-4 w-4" /> Run
            </motion.button>
          )}
          {canEdit && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStatusToggle}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 text-sm transition-all"
            >
              <Pause className="h-4 w-4" /> {workflow.isActive ? "Pause" : "Resume"}
            </motion.button>
          )}
          {canDelete && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowDelete(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 text-sm transition-all"
            >
              <Trash2 className="h-4 w-4" /> Delete
            </motion.button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 border-b border-white/10 bg-slate-900/20 flex gap-0 shrink-0">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${isActive
                ? "border-purple-500 text-white"
                : "border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600"
                }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "editor" && (
          <WorkflowEditor
            workflow={workflow}
            initialWorkflowJson={workflow.workflowJson}
            onClose={() => navigate("/workflows")}
            embedded
          />
        )}
        {activeTab === "logs" && <LogsTab workflowId={workflow.id} />}
        {activeTab === "members" && <MembersTab workflowId={workflow.id} ownerId={workflow.userId} />}
        {activeTab === "settings" && <SettingsTab workflow={workflow} onUpdate={setWorkflow} />}
      </div>

      {/* Delete confirmation */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md mx-4 p-6 rounded-2xl glass border border-white/10"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Delete workflow</h3>
                <p className="text-sm text-gray-400">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-gray-300 mb-6">
              Delete <span className="font-medium text-white">{workflow.name}</span>?
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDelete(false)} disabled={deleting} className="px-4 py-2 rounded-lg glass border border-white/10 hover:bg-white/10 text-white text-sm transition-all disabled:opacity-50">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 rounded-lg bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 text-sm transition-all disabled:opacity-50">{deleting ? "Deleting..." : "Delete"}</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
