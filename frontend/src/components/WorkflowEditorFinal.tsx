import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";
import { workflowsApi, Workflow } from "../api/workflows";
import { 
  Zap, 
  Save, 
  X,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import NodePanel from "./NodePanel";
import NodeConfigPanel from "./NodeConfigPanel";
import { nodeTypes } from "./WorkflowNodes";

type WorkflowEditorProps = {
  workflow: Workflow;
  onClose: () => void;
  initialWorkflowJson?: any;
};

function getDefaultConfig(type: string) {
  switch (type) {
    case 'webhook':
      return {
        url: '/webhook',
        method: 'POST',
        headers: {},
        body: '',
      };
    case 'cron':
      return {
        expression: '0 0 * * *',
        timezone: 'UTC',
      };
    case 'email':
      return {
        to: '',
        subject: '',
        body: '',
      };
    case 'http_request':
      return {
        url: '',
        method: 'GET',
        headers: {},
        body: '',
      };
    case 'telegram':
      return {
        botToken: '',
        chatId: '',
        message: '',
      };
    case 'database':
      return {
        connection: '',
        query: '',
        operation: 'SELECT',
      };
    case 'data_transform':
      return {
        input: '',
        script: '',
      };
    default:
      return {};
  }
}

const createNode = (nodeType: any, index: number): Node => ({
  id: `${nodeType.type}-${Date.now()}-${index}`,
  type: nodeType.type,
  position: { x: 100 + index * 40, y: 80 + index * 40 },
  data: { 
    label: nodeType.label, 
    type: nodeType.type, 
    config: getDefaultConfig(nodeType.type),
    icon: nodeType.icon,
    color: nodeType.color,
  },
});

export const WorkflowEditorFinal: React.FC<WorkflowEditorProps> = ({
  workflow,
  onClose,
  initialWorkflowJson,
}) => {
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
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
      type: n.type,
      position: { x: 150 + idx * 40, y: 80 + idx * 40 },
      data: {
        label: n.type,
        type: n.type,
        config: n.config ?? {},
        icon: Zap,
        color: '#6b7280',
      },
    }));
  }, [initialWorkflowJson]);

  const initialEdges: Edge[] = useMemo(() => {
    const edges = (initialWorkflowJson?.edges ?? []) as Array<{
      source: string;
      target: string;
    }>;
    return edges.map((e, idx) => ({
      id: `e-${idx}-${e.source}-${e.target}`,
      source: e.source,
      target: e.target,
    }));
  }, [initialWorkflowJson]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (connection: Edge | Connection) =>
      setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  const handleNodeSelect = (nodeType: any) => {
    const newNode = createNode(nodeType, nodes.length);
    setNodes((nds) => [...nds, newNode]);
  };

  const handleNodeClick = (node: Node) => {
    setSelectedNode(node);
  };

  const handleConfigUpdate = (nodeId: string, config: any) => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === nodeId
          ? {
              ...n,
              data: {
                ...n.data,
                config: config,
              },
            }
          : n
      )
    );
    
    if (selectedNode?.id === nodeId) {
      setSelectedNode({
        ...selectedNode,
        data: {
          ...selectedNode.data,
          config: config,
        },
      });
    }
  };

  const handleNodeDelete = (nodeId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => 
      eds.filter((e) => e.source !== nodeId && e.target !== nodeId)
    );
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
  };

  const handleNodeDuplicate = (node: Node) => {
    const newNode = {
      ...node,
      id: `${node.data.type}-${Date.now()}-copy`,
      position: { x: node.position.x + 20, y: node.position.y + 20 },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(undefined);
    setSaveSuccess(false);
    try {
      // Validate workflow structure
      if (nodes.length === 0) {
        throw new Error('Workflow must have at least one node');
      }
      
      const triggerNodes = nodes.filter(n => ['webhook', 'cron'].includes(n.data.type));
      if (triggerNodes.length === 0) {
        throw new Error('Workflow must have at least one trigger node');
      }

      const workflowJson = {
        nodes: nodes.map((n) => ({
          id: n.id,
          type: n.data.type,
          config: n.data.config ?? {},
        })),
        edges: edges.map((e) => ({
          source: e.source,
          target: e.target,
        })),
      };
      
      await workflowsApi.update(workflow.id, { workflowJson: workflowJson });
      setSaveSuccess(true);
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Failed to save workflow"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();

    const reactFlowBounds = event.currentTarget.getBoundingClientRect();
    const nodeType = JSON.parse(event.dataTransfer.getData('application/reactflow'));
    
    // Calculate position
    const position = {
      x: event.clientX - reactFlowBounds.left - 75,
      y: event.clientY - reactFlowBounds.top - 25,
    };

    const newNode = {
      id: `${nodeType.type}-${Date.now()}`,
      type: nodeType.type,
      position,
      data: { 
        label: nodeType.label, 
        type: nodeType.type, 
        config: getDefaultConfig(nodeType.type),
        icon: nodeType.icon,
        color: nodeType.color,
      },
    };

    setNodes((nds) => [...nds, newNode]);
  }, [setNodes]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-white/10 rounded-3xl w-[95vw] h-[90vh] max-w-7xl flex flex-col shadow-2xl"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Zap className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="text-lg font-bold text-white">
                    Edit workflow: {workflow.name}
                  </div>
                  <div className="text-sm text-gray-400">
                    Drag nodes, connect them, edit configs and save.
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {saveError && (
                <div className="px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-400" />
                    <span className="text-sm text-red-300">{saveError}</span>
                  </div>
                </div>
              )}
              {saveSuccess && !saveError && (
                <div className="px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm text-emerald-300">Saved successfully</span>
                  </div>
                </div>
              )}
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-transparent border-b-transparent animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Save workflow</span>
                  </>
                )}
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="flex items-center gap-2 px-4 py-2 rounded-xl glass border border-white/10 hover:bg-white/10 text-white transition-all duration-300"
              >
                <X className="h-4 w-4" />
                <span>Close</span>
              </motion.button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Node Panel */}
            <div className="w-64 border-r border-white/10 p-4 bg-slate-900/50 backdrop-blur-sm">
              <NodePanel onNodeSelect={handleNodeSelect} />
            </div>

            {/* React Flow Canvas */}
            <div 
              className="flex-1 relative bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <ReactFlowProvider>
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  onNodeClick={handleNodeClick}
                  nodeTypes={nodeTypes}
                  fitView
                  connectionLineType="smoothstep"
                  connectionLineStyle={{
                    stroke: '#6b7280',
                    strokeWidth: 2,
                  }}
                  style={{
                    background: 'transparent',
                  }}
                >
                  <Background color="#1e293b" />
                  <MiniMap 
                    nodeColor="#6b7280"
                    maskColor="#1e293b"
                    nodeStrokeColor="#6b7280"
                  />
                  <Controls 
                    showZoom={false}
                    showFitView={true}
                    showInteractive={false}
                  />
                </ReactFlow>
              </ReactFlowProvider>
            </div>

            {/* Configuration Panel */}
            <div className="w-80 border-l border-white/10 p-4 bg-slate-900/50 backdrop-blur-sm">
              <NodeConfigPanel
                selectedNode={selectedNode}
                onConfigUpdate={handleConfigUpdate}
                onNodeDelete={handleNodeDelete}
                onNodeDuplicate={handleNodeDuplicate}
              />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
