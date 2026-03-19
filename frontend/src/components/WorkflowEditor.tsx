import React, { useCallback, useEffect, useMemo, useState } from "react";
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

type WorkflowEditorProps = {
  workflow: Workflow;
  onClose: () => void;
  initialWorkflowJson?: any;
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

const createNode = (type: string, index: number): Node => ({
  id: `${type}-${Date.now()}-${index}`,
  type: "default",
  position: { x: 100 + index * 40, y: 80 + index * 40 },
  data: { label: nodeTypeLabels[type] ?? type, type, config: {} },
});

export const WorkflowEditor: React.FC<WorkflowEditorProps> = ({
  workflow,
  onClose,
  initialWorkflowJson,
  embedded = false,
}) => {
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [configText, setConfigText] = useState<string>("{}");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | undefined>();
  const [saveSuccess, setSaveSuccess] = useState(false);

  const initialNodes: Node[] = useMemo(() => {
    const nodes = (initialWorkflowJson?.nodes ?? []) as Array<{
      id: string;
      type: string;
      config?: unknown;
    }>;
    if (!nodes.length) return [];
    return nodes.map((n, idx) => ({
      id: n.id,
      type: "default",
      position: { x: 150 + idx * 40, y: 80 + idx * 40 },
      data: {
        label: nodeTypeLabels[n.type] ?? n.type,
        type: n.type,
        config: n.config ?? {},
      },
    }));
  }, [initialWorkflowJson]);

  const initialEdges: Edge[] = useMemo(() => {
    const edges = (initialWorkflowJson?.edges ?? []) as Array<{
      from: string;
      to: string;
    }>;
    return edges.map((e, idx) => ({
      id: `e-${idx}-${e.from}-${e.to}`,
      source: e.from,
      target: e.to,
    }));
  }, [initialWorkflowJson]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    if (selectedNode?.data?.config) {
      setConfigText(JSON.stringify(selectedNode.data.config, null, 2));
    }
  }, [selectedNode]);

  const onConnect = useCallback(
    (connection: Edge | Connection) =>
      setEdges((eds) => addEdge(connection, eds)),
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
            ? {
              ...n,
              data: {
                ...n.data,
                config: parsed,
              },
            }
            : n
        )
      );
      setSelectedNode((n) =>
        n
          ? {
            ...n,
            data: {
              ...n.data,
              config: parsed,
            },
          }
          : n
      );
      setSaveError(undefined);
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Invalid JSON configuration"
      );
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(undefined);
    setSaveSuccess(false);
    try {
      const workflowJson = {
        nodes: nodes.map((n) => ({
          id: n.id,
          type: n.data.type,
          config: n.data.config ?? {},
        })),
        edges: edges.map((e) => ({
          from: e.source,
          to: e.target,
        })),
      };
      await workflowsApi.update(workflow.id, { workflowJson });
      setSaveSuccess(true);
    } catch (err: any) {
      const msg = err?.response?.data?.message || (err instanceof Error ? err.message : "Failed to save workflow");
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  };

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
            {saveError && (
              <span className="text-xs text-red-400 max-w-xs truncate">
                {saveError}
              </span>
            )}
            {saveSuccess && !saveError && (
              <span className="text-xs text-emerald-300">Saved</span>
            )}
            <button
              className="px-3 py-1.5 text-xs rounded-md bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save workflow"}
            </button>
            <button
              className="px-3 py-1.5 text-xs rounded-md border border-slate-700 hover:bg-slate-800"
              onClick={onClose}
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
            {saveError && <span className="text-xs text-red-400 max-w-xs truncate">{saveError}</span>}
            {saveSuccess && !saveError && <span className="text-xs text-emerald-300">Saved</span>}
            <button className="px-3 py-1.5 text-xs rounded-md bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50" onClick={handleSave} disabled={saving}>
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
              <button
                className="mt-2 px-2 py-1 text-xs rounded-md border border-slate-700 hover:bg-slate-800 transition-colors"
                onClick={handleConfigApply}
              >
                Apply config
              </button>
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

  if (embedded) return editorContent;

  return (
    <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center">
      {editorContent}
    </div>
  );
};

