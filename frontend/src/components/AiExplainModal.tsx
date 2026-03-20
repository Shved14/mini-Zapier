import React, { useState } from "react";
import { Sparkles, X, Loader2, Lightbulb, Wrench } from "lucide-react";
import { aiApi, AiExplanation } from "../api/ai";

interface AiExplainModalProps {
  error: string;
  nodeType: string;
  config: Record<string, unknown>;
  onClose: () => void;
}

export const AiExplainModal: React.FC<AiExplainModalProps> = ({
  error,
  nodeType,
  config,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiExplanation | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [fetched, setFetched] = useState(false);

  const handleExplain = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const data = await aiApi.explainError(error, nodeType, config);
      setResult(data);
      setFetched(true);
    } catch (err: any) {
      setFetchError(err?.response?.data?.message || "Failed to get explanation");
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch on mount
  React.useEffect(() => {
    if (!fetched) handleExplain();
  }, []);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <span className="font-semibold text-white">AI Error Explanation</span>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/10 text-gray-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-4 space-y-4">
          {/* Original error */}
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <div className="text-xs text-red-400 font-medium mb-1">Original Error</div>
            <pre className="text-xs text-red-200 whitespace-pre-wrap break-words">{error}</pre>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
              <span className="ml-2 text-sm text-slate-400">Analyzing error...</span>
            </div>
          )}

          {fetchError && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm text-amber-300">
              {fetchError}
            </div>
          )}

          {result && (
            <>
              {/* Explanation */}
              <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-medium text-purple-300">What went wrong</span>
                </div>
                <p className="text-sm text-slate-200 leading-relaxed">{result.explanation}</p>
              </div>

              {/* Suggested fix */}
              <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Wrench className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-300">Suggested Fix</span>
                </div>
                <p className="text-sm text-slate-200 leading-relaxed">{result.suggestedFix}</p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-slate-800">
          {result && (
            <button
              onClick={handleExplain}
              disabled={loading}
              className="px-3 py-1.5 text-xs rounded-lg bg-purple-600/20 text-purple-300 hover:bg-purple-600/30 border border-purple-500/20 transition-colors disabled:opacity-50"
            >
              Re-analyze
            </button>
          )}
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
