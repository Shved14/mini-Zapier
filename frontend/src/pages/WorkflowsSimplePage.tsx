import React from "react";
import { motion } from "framer-motion";
import { Plus, Play, Edit, Trash2, Zap, Clock, Activity, Settings } from "lucide-react";

export const WorkflowsSimplePage: React.FC = () => {
  // Моковые данные
  const workflows = [
    {
      id: "1",
      name: "Webhook to Telegram",
      triggerType: "webhook",
      isActive: true,
      createdAt: new Date().toISOString(),
      runs: 0,
    },
    {
      id: "2", 
      name: "Daily Email Report",
      triggerType: "cron",
      isActive: false,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      runs: 5,
    },
  ];

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
          onClick={() => alert('Create workflow functionality coming soon!')}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 neon-border"
        >
          <Plus className="h-5 w-5" />
          New workflow
        </motion.button>
      </div>

      {/* Workflows Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {workflows.map((workflow, index) => (
          <motion.div
            key={workflow.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
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
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  workflow.isActive
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
                    {workflow.runs}
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
                  disabled={!workflow.isActive}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                  <Play className="h-4 w-4" />
                  Run
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => alert('Edit functionality coming soon!')}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg glass border border-white/10 hover:bg-white/10 text-white transition-all duration-300"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => alert('Delete functionality coming soon!')}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 transition-all duration-300"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </motion.button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {workflows.length === 0 && (
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
        </motion.div>
      )}
    </div>
  );
};
