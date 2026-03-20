import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  Connection,
  Edge,
  Node,
  useEdgesState,
  useNodesState,
} from "reactflow";
import "reactflow/dist/style.css";
import { workflowsApi, Workflow } from "../api/workflows";
import { useWorkflowStore } from "../store/workflowStore";
import { useConfirmDialog } from "./ConfirmDialog";
import { TestNodeModal } from "./TestNodeModal";
import { TemplatesModal } from "./TemplatesModal";
import { WorkflowTemplate } from "../api/ai";

type WorkflowEditorProps = {
  workflow: Workflow;
  onClose: () => void;
  onSave?: (workflowJson: any) => void;
  embedded?: boolean;
};

const nodeTypeLabels: Record<string, string> = {
  trigger: "Trigger",
  http: "HTTP",
  email: "Email",
  telegram: "Telegram",
  db: "Database",
  transform: "Transform",
};

const paletteNodes = [
  "trigger",
  "http",
  "email",
  "telegram",
  "db",
  "transform",
] as const;

const defaultConfigs: Record<string, Record<string, unknown>> = {
  http: { url: "https://example.com/api", method: "GET", headers: {} },
  email: { to: "", subject: "", body: "" },
  telegram: { chatId: "", message: "" },
  db: { operation: "query", query: "" },
  transform: { expression: "" },
  trigger: {},
};

const createNode = (type: string, index: number): Node => ({
  id: `${type}-${Date.now()}-${index}`,
  type: "default",
  position: { x: 100 + index * 40, y: 80 + index * 40 },
  data: { label: nodeTypeLabels[type] ?? type, type, config: defaultConfigs[type] ?? {} },
});

// Parse workflow JSON into ReactFlow nodes
function parseNodes(wf: Workflow): Node[] {
  const raw = ((wf as any).workflowJson?.nodes ?? []) as Array<{
    id: string;
    type: string;
    config?: unknown;
    position?: { x: number; y: number };
  }>;
  return raw.map((n, idx) => ({
    id: n.id,
    type: "default",
    position: n.position ?? { x: 150 + idx * 40, y: 80 + idx * 40 },
    data: {
      label: nodeTypeLabels[n.type] ?? n.type,
      type: n.type,
      config: n.config ?? {},
    },
  }));
}

// Parse workflow JSON into ReactFlow edges
function parseEdges(wf: Workflow): Edge[] {
  const raw = ((wf as any).workflowJson?.edges ?? []) as Array<{
    source?: string; target?: string; from?: string; to?: string;
  }>;
  return raw.map((e, idx) => ({
    id: `e-${idx}-${e.source || e.from}-${e.target || e.to}`,
    source: e.source || e.from || "",
    target: e.target || e.to || "",
  }));
}

export const WorkflowEditor: React.FC<WorkflowEditorProps> = ({
  workflow,
  onClose,
  onSave,
  embedded = false,
}) => {
  const { setUnsavedChanges } = useWorkflowStore();
  const { showConfirmDialog, ConfirmDialogComponent } = useConfirmDialog();

  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [configText, setConfigText] = useState<string>("{}");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | undefined>();
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [showTestModal, setShowTestModal] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  // ─── Initialize nodes/edges ONCE from workflow prop ───
  const [nodes, setNodes, onNodesChange] = useNodesState(parseNodes(workflow));
  const [edges, setEdges, onEdgesChange] = useEdgesState(parseEdges(workflow));

  // Track whether user has made changes since last save
  const hasChanges = useRef(false);
  // Guard: skip the very first render's auto-save
  const initialized = useRef(false);
  // Prevent saving while already saving
  const isSaving = useRef(false);

  // ─── Serialize current state for auto-save dependency ───
  const nodesJson = useMemo(() => JSON.stringify(
    nodes.map(n => ({ id: n.id, type: n.data.type, config: n.data.config, position: n.position }))
  ), [nodes]);

  const edgesJson = useMemo(() => JSON.stringify(
    edges.map(e => ({ source: e.source, target: e.target }))
  ), [edges]);

  // ─── Mark dirty whenever nodes/edges actually change ───
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      return;
    }
    hasChanges.current = true;
    setUnsavedChanges(true);
    setSaveStatus("idle");
  }, [nodesJson, edgesJson]);

  // ─── Save function ───
  const doSave = useCallback(async () => {
    if (isSaving.current || !hasChanges.current) return;
    isSaving.current = true;
    setSaving(true);
    setSaveError(undefined);
    setSaveStatus("saving");

    try {
      const workflowJson = {
        nodes: nodes.map((n) => ({
          id: n.id,
          type: n.data.type,
          config: n.data.config ?? {},
          position: n.position,
        })),
        edges: edges.map((e) => ({
          source: e.source,
          target: e.target,
        })),
      };

      await workflowsApi.update(workflow.id, { workflowJson });

      // Mark clean — do NOT reload from server, do NOT call setNodes
      hasChanges.current = false;
      setUnsavedChanges(false);
      setSaveStatus("saved");

      // Notify parent so its workflow state stays fresh for tab switches
      onSave?.(workflowJson);
    } catch (err: any) {
      const msg = err?.response?.data?.message || (err instanceof Error ? err.message : "Failed to save");
      setSaveError(msg);
      setSaveStatus("idle");
    } finally {
      setSaving(false);
      isSaving.current = false;
    }
  }, [nodes, edges, workflow.id]);

  // ─── Auto-save with 1.5s debounce, triggered by actual data changes ───
  useEffect(() => {
    if (!hasChanges.current) return;

    const timer = setTimeout(() => {
      doSave();
    }, 1500);

    return () => clearTimeout(timer);
  }, [nodesJson, edgesJson, doSave]);

  // ─── Node/edge interaction handlers ───
  useEffect(() => {
    if (selectedNode?.data?.config) {
      setConfigText(JSON.stringify(selectedNode.data.config, null, 2));
    }
  }, [selectedNode]);

  const onConnect = useCallback(
    (connection: Edge | Connection) => {
      setEdges((eds) => addEdge(connection, eds));
    },
    [setEdges]
  );

  const handleAddNode = (type: string) => {
    setNodes((nds) => [...nds, createNode(type, nds.length)]);
  };

  const handleSelectNode = (node: Node) => {
    setSelectedNode(node);
  };

  const handleConfigApply = () => {
    if (!selectedNode) return;
    try {
      const parsed = configText.trim() ? JSON.parse(configText) : {};
      setNodes((nds) =>
        nds.map((n) =>
          n.id === selectedNode.id
            ? { ...n, data: { ...n.data, config: parsed } }
            : n
        )
      );
      setSelectedNode((n) =>
        n ? { ...n, data: { ...n.data, config: parsed } } : n
      );
      setSaveError(undefined);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Invalid JSON configuration");
    }
  };

  const handleClose = async () => {
    if (hasChanges.current) {
      const confirmed = await showConfirmDialog(
        "Unsaved changes",
        "You have unsaved changes. Are you sure you want to close?"
      );
      if (confirmed) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const handleLoadTemplate = (template: WorkflowTemplate) => {
    const newNodes: Node[] = template.nodes.map((n) => ({
      id: n.id,
      type: "default",
      position: n.position,
      data: { label: nodeTypeLabels[n.type] ?? n.type, type: n.type, config: n.config },
    }));
    const newEdges: Edge[] = template.edges.map((e, idx) => ({
      id: `e-${idx}-${e.source}-${e.target}`,
      source: e.source,
      target: e.target,
    }));
    setNodes(newNodes);
    setEdges(newEdges);
    setShowTemplates(false);
  };

  // ─── Status indicator ───
  const statusIndicator = saveError ? (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-500/10 border border-red-500/20">
      <span className="w-2 h-2 rounded-full bg-red-400" />
      <span className="text-[11px] text-red-400 max-w-[160px] truncate">{saveError}</span>
    </div>
  ) : saveStatus === "saving" ? (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
      <span className="text-[11px] text-amber-400">Saving...</span>
    </div>
  ) : saveStatus === "saved" ? (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
      <span className="w-2 h-2 rounded-full bg-emerald-400" />
      <span className="text-[11px] text-emerald-300">Saved</span>
    </div>
  ) : hasChanges.current ? (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-500/10 border border-slate-600">
      <span className="w-2 h-2 rounded-full bg-slate-400" />
      <span className="text-[11px] text-slate-400">Unsaved changes</span>
    </div>
  ) : null;

  const editorContent = (
    <div className={embedded ? "flex flex-col h-full" : "bg-slate-950 border border-slate-800 rounded-xl w-[95vw] h-[90vh] flex flex-col shadow-xl"}>
      {!embedded && (
        <div className="px-4 py-3 border-b border-slate-800 flex justify-between items-center">
          <div>
            <div className="text-sm font-semibold">
              Edit workflow: {workflow.name}
            </div>
            <div className="text-xs text-slate-400">
              Drag nodes, connect them, edit configs and save.
            </div>
          </div>
          <div className="flex items-center gap-2">
            {statusIndicator}
            <button
              className="px-3 py-1.5 text-xs rounded-md bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
              onClick={doSave}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save workflow"}
            </button>
            <button
              className="px-3 py-1.5 text-xs rounded-md border border-slate-700 hover:bg-slate-800"
              onClick={handleClose}
            >
              Close
            </button>
          </div>
        </div>
      )}
      {embedded && (
        <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
          <span className="text-xs text-slate-400">Drag nodes, connect them, edit configs and save.</span>
          <div className="flex items-center gap-2">
            {statusIndicator}
            <button className="px-3 py-1.5 text-xs rounded-md bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50" onClick={doSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      )}
      <div className="flex-1 flex min-h-0">
        <div className="w-52 border-r border-slate-800 p-3 space-y-2 bg-slate-900/60 overflow-y-auto">
          <div className="text-xs font-semibold text-slate-300 mb-1">
            Nodes
          </div>
          {paletteNodes.map((type) => (
            <button
              key={type}
              className="w-full text-left text-xs px-2 py-1.5 rounded-md border border-slate-700 hover:bg-slate-800 transition-colors"
              onClick={() => handleAddNode(type)}
            >
              {nodeTypeLabels[type] ?? type}
            </button>
          ))}
          <div className="pt-2 mt-2 border-t border-slate-800">
            <button
              className="w-full text-left text-xs px-2 py-1.5 rounded-md border border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 transition-colors"
              onClick={() => setShowTemplates(true)}
            >
              📋 Templates
            </button>
          </div>
        </div>
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
            onNodeClick={(_, node) => handleSelectNode(node)}
          >
            <Background />
            <MiniMap />
            <Controls />
          </ReactFlow>
        </div>
        <div className="w-80 border-l border-slate-800 p-3 bg-slate-900/60 flex flex-col overflow-y-auto">
          <div className="text-xs font-semibold text-slate-300 mb-2">
            Node configuration
          </div>
          {selectedNode ? (
            <>
              <div className="text-xs text-slate-400 mb-1">
                {selectedNode.data.type} ({selectedNode.id})
              </div>
              <textarea
                className="flex-1 text-xs bg-slate-950/60 border border-slate-800 rounded-md p-2 font-mono text-slate-100 resize-none min-h-[120px]"
                value={configText}
                onChange={(e) => setConfigText(e.target.value)}
              />
              <div className="flex gap-2 mt-2">
                <button
                  className="flex-1 px-2 py-1.5 text-xs rounded-md border border-slate-700 hover:bg-slate-800 transition-colors"
                  onClick={handleConfigApply}
                >
                  Apply config
                </button>
                <button
                  className="px-3 py-1.5 text-xs rounded-md bg-blue-600/20 text-blue-300 border border-blue-500/20 hover:bg-blue-600/30 transition-colors"
                  onClick={() => {
                    handleConfigApply();
                    setShowTestModal(true);
                  }}
                >
                  ▶ Test
                </button>
              </div>
            </>
          ) : (
            <div className="text-xs text-slate-500">
              Select a node to edit configuration.
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const modals = (
    <>
      <ConfirmDialogComponent />
      {showTestModal && selectedNode && (
        <TestNodeModal
          nodeType={selectedNode.data.type}
          nodeId={selectedNode.id}
          config={selectedNode.data.config || {}}
          onClose={() => setShowTestModal(false)}
        />
      )}
      {showTemplates && (
        <TemplatesModal
          onSelect={handleLoadTemplate}
          onClose={() => setShowTemplates(false)}
        />
      )}
    </>
  );

  if (embedded) return <>{editorContent}{modals}</>;

  return (
    <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center">
      {editorContent}
      {modals}
    </div>
  );
};

