import React, { useState } from "react";
import { Play, X, Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import { nodesApi, TestNodeResult } from "../api/ai";

interface TestNodeModalProps {
  nodeType: string;
  nodeId: string;
  config: Record<string, unknown>;
  onClose: () => void;
}

export const TestNodeModal: React.FC<TestNodeModalProps> = ({
  nodeType,
  nodeId,
  config,
  onClose,
}) => {
  const [inputText, setInputText] = useState("null");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TestNodeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTest = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      let parsedInput: unknown = null;
      try {
        parsedInput = JSON.parse(inputText);
      } catch {
        setError("Invalid JSON input");
        setLoading(false);
        return;
      }
      const data = await nodesApi.testNode({ type: nodeType, config }, parsedInput);
      setResult(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.response?.data?.error || "Test failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Play className="w-5 h-5 text-blue-400" />
            <span className="font-semibold text-white">Test Node</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
              {nodeType}
            </span>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/10 text-gray-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-4 space-y-4">
          {/* Config preview */}
          <div>
            <div className="text-xs text-slate-400 mb-1.5 font-medium">Node Config</div>
            <pre className="p-3 rounded-lg bg-black/30 border border-slate-800 text-xs text-slate-300 overflow-x-auto max-h-32">
              {JSON.stringify(config, null, 2)}
            </pre>
          </div>

          {/* Input */}
          <div>
            <div className="text-xs text-slate-400 mb-1.5 font-medium">Input Data (JSON)</div>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full h-24 p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-100 font-mono resize-none focus:border-blue-500/50 focus:outline-none transition-colors"
              placeholder='null or { "key": "value" }'
            />
          </div>

          {/* Run button */}
          <button
            onClick={handleTest}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Run Test
              </>
            )}
          </button>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="flex items-center gap-1.5 mb-1">
                <XCircle className="w-4 h-4 text-red-400" />
                <span className="text-xs text-red-300 font-medium">Error</span>
              </div>
              <pre className="text-xs text-red-200 whitespace-pre-wrap">{error}</pre>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className={`p-3 rounded-lg border ${result.success
              ? "bg-emerald-500/10 border-emerald-500/20"
              : "bg-red-500/10 border-red-500/20"
              }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  {result.success ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400" />
                  )}
                  <span className={`text-xs font-medium ${result.success ? "text-emerald-300" : "text-red-300"}`}>
                    {result.success ? "Success" : "Failed"}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <Clock className="w-3 h-3" />
                  {result.durationMs}ms
                </div>
              </div>

              {result.error && (
                <pre className="text-xs text-red-200 whitespace-pre-wrap mb-2">{result.error}</pre>
              )}

              {result.data !== undefined && result.data !== null && (
                <div>
                  <div className="text-xs text-slate-400 mb-1">Output</div>
                  <pre className="p-2 rounded bg-black/30 text-xs text-slate-300 overflow-x-auto max-h-48">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
