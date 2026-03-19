import React, { useState } from "react";
import { Settings, Save } from "lucide-react";
import { workflowsApi, Workflow } from "../../api/workflows";

type SettingsTabProps = {
  workflow: Workflow;
  onUpdate: (wf: Workflow | null) => void;
};

export const SettingsTab: React.FC<SettingsTabProps> = ({ workflow, onUpdate }) => {
  const [slackWebhook, setSlackWebhook] = useState(workflow.slackWebhook || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const updated = await workflowsApi.update(workflow.id, { slackWebhook } as any);
      onUpdate(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { /* silently fail */ }
    finally { setSaving(false); }
  };

  return (
    <div className="p-6 h-full overflow-y-auto max-w-2xl">
      <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-6">
        <Settings className="h-5 w-5 text-purple-400" />
        Settings
      </h3>

      <div className="space-y-6">
        {/* General info */}
        <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-3">
          <h4 className="text-sm font-medium text-white">General</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Workflow ID</span>
              <div className="text-gray-300 font-mono text-xs mt-1 select-all">{workflow.id}</div>
            </div>
            <div>
              <span className="text-gray-500">Owner</span>
              <div className="text-gray-300 font-mono text-xs mt-1 select-all">{workflow.userId}</div>
            </div>
            <div>
              <span className="text-gray-500">Created</span>
              <div className="text-gray-300 text-xs mt-1">{new Date(workflow.createdAt).toLocaleString()}</div>
            </div>
            <div>
              <span className="text-gray-500">Status</span>
              <div className="mt-1">
                <span className={`px-2 py-0.5 rounded-full text-xs ${workflow.isActive
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "bg-amber-500/20 text-amber-300"
                  }`}>{workflow.isActive ? "Active" : "Paused"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Slack Integration */}
        <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-3">
          <h4 className="text-sm font-medium text-white">Slack Integration</h4>
          <p className="text-xs text-gray-500">
            Receive notifications in Slack when workflows are executed, updated, or encounter errors.
          </p>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Webhook URL</label>
            <input
              value={slackWebhook}
              onChange={(e) => setSlackWebhook(e.target.value)}
              placeholder="https://hooks.slack.com/services/..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 font-mono"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 transition-all"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save settings"}
            </button>
            {saved && <span className="text-xs text-emerald-400">Settings saved!</span>}
          </div>
        </div>
      </div>
    </div>
  );
};
