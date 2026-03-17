import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "../store/useAppStore";
import { workflowsApi, Workflow } from "../api/workflows";
import { WorkflowEditor } from "../components/WorkflowEditor";
import { Plus, Play, Edit, Trash2, Zap, Clock, Activity, Settings } from "lucide-react";

export const WorkflowsPage: React.FC = () => {
  const { workflows, loading, error, fetchWorkflows } = useAppStore();
  const [editing, setEditing] = useState<Workflow | null>(null);
  const [editingJson, setEditingJson] = useState<any | undefined>(undefined);
  const [deleting, setDeleting] = useState<Workflow | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  const openEditor = async (wf: Workflow) => {
    try {
      const full = await workflowsApi.get(wf.id);
      setEditing(wf);
      setEditingJson((full as any).workflowJson ?? undefined);
    } catch {
      setEditing(wf);
      setEditingJson(undefined);
    }
  };

  const createNewWorkflow = async () => {
    try {
      const newWorkflow = await workflowsApi.create({
        name: "New workflow",
        triggerType: "webhook",
      });
      await fetchWorkflows();
      openEditor(newWorkflow);
    } catch (error) {
      console.error('Failed to create workflow:', error);
    }
  };

  const runWorkflow = async (workflowId: string) => {
    try {
      await workflowsApi.run(workflowId);
    } catch (error) {
      console.error('Failed to run workflow:', error);
    }
  };

  const deleteWorkflow = async (workflow: Workflow) => {
    if (!workflow) return;
    setDeletingLoading(true);
    try {
      await workflowsApi.remove(workflow.id);
      await fetchWorkflows();
      setDeleting(null);
    } finally {
      setDeletingLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Workflows</h1>
          <p className="text-gray-400 mt-1">Manage and automate your workflows</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={createNewWorkflow}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 neon-border"
        >
          <Plus className="h-5 w-5" />
          New workflow
        </motion.button>
      </div>

      {/* Loading State */}
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center py-12"
        >
          <div className="text-gray-400">Loading workflows...</div>
        </motion.div>
      )}

      {/* Error State */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 rounded-xl bg-red-500/10 border border-red-500/30"
        >
          <p className="text-red-400">{error}</p>
        </motion.div>
      )}

      {/* Workflows Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence>
          {workflows.map((workflow, index) => (
            <motion.div
              key={workflow.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="group"
            >
              <div className="glass rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-xl hover-glow">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {workflow.name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Zap className="h-4 w-4" />
                      <span>{workflow.triggerType}</span>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${workflow.isActive
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                    }`}>
                    {workflow.isActive ? 'Active' : 'Inactive'}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
                      <Clock className="h-3 w-3" />
                    </div>
                    <div className="text-xs text-gray-400">Created</div>
                    <div className="text-sm text-white font-medium">
                      {new Date(workflow.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
                      <Activity className="h-3 w-3" />
                    </div>
                    <div className="text-xs text-gray-400">Runs</div>
                    <div className="text-sm text-white font-medium">
                      {/* This would come from API */}
                      0
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
                      <Settings className="h-3 w-3" />
                    </div>
                    <div className="text-xs text-gray-400">Status</div>
                    <div className="text-sm text-white font-medium">
                      {workflow.isActive ? 'Running' : 'Paused'}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 border-t border-white/10">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => runWorkflow(workflow.id)}
                    disabled={!workflow.isActive}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                  >
                    <Play className="h-4 w-4" />
                    Run
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => openEditor(workflow)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg glass border border-white/10 hover:bg-white/10 text-white transition-all duration-300"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setDeleting(workflow)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 transition-all duration-300"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {!loading && workflows.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-500/20 border border-purple-500/30 mb-4">
            <Zap className="h-8 w-8 text-purple-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No workflows yet</h3>
          <p className="text-gray-400 mb-6">Create your first workflow to get started</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={createNewWorkflow}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 neon-border"
          >
            <Plus className="h-5 w-5" />
            Create workflow
          </motion.button>
        </motion.div>
      )}

      {/* Workflow Editor Modal */}
      <AnimatePresence>
        {editing && (
          <WorkflowEditor
            workflow={editing}
            initialWorkflowJson={editingJson}
            onClose={() => {
              setEditing(null);
              setEditingJson(undefined);
              fetchWorkflows();
            }}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md mx-4 p-6 rounded-2xl glass border border-white/10 backdrop-blur-lg"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                  <Trash2 className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Delete workflow</h3>
                  <p className="text-sm text-gray-400">
                    This action cannot be undone
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-gray-300">
                  You are about to delete{' '}
                  <span className="font-medium text-white">{deleting.name}</span>
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setDeleting(null)}
                  disabled={deletingLoading}
                  className="px-4 py-2 rounded-lg glass border border-white/10 hover:bg-white/10 text-white transition-all duration-300 disabled:opacity-50"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => deleteWorkflow(deleting)}
                  disabled={deletingLoading}
                  className="px-4 py-2 rounded-lg bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 transition-all duration-300 disabled:opacity-50"
                >
                  {deletingLoading ? 'Deleting...' : 'Delete'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

