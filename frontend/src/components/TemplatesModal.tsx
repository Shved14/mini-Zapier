import React, { useEffect, useState } from "react";
import { X, Loader2, LayoutTemplate, ArrowRight } from "lucide-react";
import { templatesApi, WorkflowTemplate } from "../api/ai";

interface TemplatesModalProps {
  onSelect: (template: WorkflowTemplate) => void;
  onClose: () => void;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({ onSelect, onClose }) => {
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await templatesApi.list();
        setTemplates(data);
      } catch (err: any) {
        setError("Failed to load templates");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl shadow-2xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <LayoutTemplate className="w-5 h-5 text-purple-400" />
            <span className="font-semibold text-white">Workflow Templates</span>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/10 text-gray-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-4 overflow-y-auto flex-1">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
            </div>
          )}

          {error && (
            <div className="text-center py-8 text-red-400 text-sm">{error}</div>
          )}

          {!loading && !error && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {templates.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => onSelect(tpl)}
                  className="group text-left p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-purple-500/40 hover:bg-slate-800 transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-2xl">{tpl.icon}</span>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-purple-400 transition-colors" />
                  </div>
                  <div className="text-sm font-medium text-white mb-1">{tpl.name}</div>
                  <div className="text-xs text-slate-400 leading-relaxed">{tpl.description}</div>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/60 text-slate-400 border border-slate-700">
                      {tpl.nodes.length} nodes
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/60 text-slate-400 border border-slate-700">
                      {tpl.edges.length} connections
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
