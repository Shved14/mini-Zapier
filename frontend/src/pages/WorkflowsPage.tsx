import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "../store/useAppStore";
import { Workflow } from "../api/workflows";
import { Plus, Play, Trash2, Zap, Clock, ArrowRight } from "lucide-react";

export const WorkflowsPage: React.FC = () => {
  const { workflows, loading, error, fetchWorkflows, createWorkflow, deleteWorkflow: storeDelete, runWorkflow } = useAppStore();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState<Workflow | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  const createNewWorkflow = async () => {
    setActionError(null);
    try {
      const newWorkflow = await createWorkflow("New workflow");
      navigate(`/workflows/${newWorkflow.id}`);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to create workflow");
    }
  };

  const handleRun = async (e: React.MouseEvent, workflowId: string) => {
    e.stopPropagation();
    setActionError(null);
    try {
      await runWorkflow(workflowId);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to run workflow");
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, workflow: Workflow) => {
    e.stopPropagation();
    setDeleting(workflow);
  };

  const handleDelete = async (workflow: Workflow) => {
    if (!workflow) return;
    setDeletingLoading(true);
    setActionError(null);
    try {
      await storeDelete(workflow.id);
      setDeleting(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to delete workflow");
    } finally {
      setDeletingLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Workflows</h1>
          <p className="text-gray-500 text-sm mt-1">Manage and automate your workflows</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={createNewWorkflow}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-medium shadow-lg hover:shadow-purple-500/25 transition-all duration-300 text-sm"
        >
          <Plus className="h-4 w-4" />
          New workflow
        </motion.button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500 animate-pulse">Loading workflows...</div>
        </div>
      )}

      {/* Error */}
      {(error || actionError) && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
          <p className="text-red-400 text-sm">{error || actionError}</p>
        </div>
      )}

      {/* Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence>
          {workflows.map((workflow, index) => {
            const isActive = workflow.status === "active" || workflow.isActive;
            return (
              <motion.div
                key={workflow.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25, delay: index * 0.05 }}
                onClick={() => navigate(`/workflows/${workflow.id}`)}
                className="group cursor-pointer"
              >
                <div className="rounded-xl p-5 border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-purple-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20 flex items-center justify-center shrink-0">
                        <Zap className="h-4 w-4 text-purple-400" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-white truncate group-hover:text-purple-300 transition-colors">
                          {workflow.name}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                          <Clock className="h-3 w-3" />
                          {new Date(workflow.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium ${isActive
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"
                        : "bg-gray-500/20 text-gray-400 border border-gray-500/20"
                      }`}>
                      {isActive ? "Active" : "Paused"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    <div className="flex items-center gap-1.5">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => handleRun(e, workflow.id)}
                        className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all"
                        title="Run workflow"
                      >
                        <Play className="h-3.5 w-3.5" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => handleDeleteClick(e, workflow)}
                        className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                        title="Delete workflow"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </motion.button>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 group-hover:text-purple-400 transition-colors">
                      Open <ArrowRight className="h-3 w-3" />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {!loading && workflows.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-purple-500/20 border border-purple-500/20 mb-4">
            <Zap className="h-7 w-7 text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">No workflows yet</h3>
          <p className="text-gray-500 text-sm mb-6">Create your first workflow to get started</p>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={createNewWorkflow}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-medium text-sm"
          >
            <Plus className="h-4 w-4" /> Create workflow
          </motion.button>
        </motion.div>
      )}

      {/* Delete Modal */}
      <AnimatePresence>
        {deleting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm mx-4 p-6 rounded-2xl bg-slate-900 border border-white/10 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                  <Trash2 className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Delete workflow</h3>
                  <p className="text-xs text-gray-500">This cannot be undone</p>
                </div>
              </div>
              <p className="text-sm text-gray-300 mb-5">
                Delete <span className="font-medium text-white">{deleting.name}</span>?
              </p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setDeleting(null)} disabled={deletingLoading} className="px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 text-white text-sm transition-all disabled:opacity-50">Cancel</button>
                <button onClick={() => handleDelete(deleting)} disabled={deletingLoading} className="px-4 py-2 rounded-lg bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 text-sm transition-all disabled:opacity-50">{deletingLoading ? "Deleting..." : "Delete"}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
