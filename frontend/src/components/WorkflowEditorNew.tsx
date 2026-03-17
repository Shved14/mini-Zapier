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
  Mail, 
  Globe, 
  Send, 
  Database, 
  RefreshCw, 
  Settings, 
  Save, 
  X,
  Plus,
  Play,
  Pause,
  Copy,
  Trash2,
  CheckCircle,
  AlertCircle,
  Info,
  Clock
} from "lucide-react";

type WorkflowEditorProps = {
  workflow: Workflow;
  onClose: () => void;
  initialWorkflowJson?: any;
};

const nodeTypes = [
  { type: 'webhook', label: 'Webhook', icon: Globe, color: '#3b82f6' },
  { type: 'cron', label: 'Cron', icon: Clock, color: '#8b5cf6' },
  { type: 'email', label: 'Email', icon: Mail, color: '#10b981' },
  { type: 'http_request', label: 'HTTP Request', icon: Send, color: '#f59e0b' },
  { type: 'telegram', label: 'Telegram', icon: Send, color: '#22c55e' },
  { type: 'database', label: 'Database', icon: Database, color: '#06b6d4' },
  { type: 'data_transform', label: 'Transform', icon: RefreshCw, color: '#8b5cf6' },
];

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

const createNode = (type: typeof nodeTypes[number], index: number): Node => ({
  id: `${type.type}-${Date.now()}-${index}`,
  type: 'default',
  position: { x: 100 + index * 40, y: 80 + index * 40 },
  data: { 
    label: type.label, 
    type: type.type, 
    config: getDefaultConfig(type.type),
    icon: type.icon,
    color: type.color,
  },
});

export const WorkflowEditor: React.FC<WorkflowEditorProps> = ({
  workflow,
  onClose,
  initialWorkflowJson,
}) => {
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [configText, setConfigText] = useState<string>("{}");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | undefined>();
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isValid, setIsValid] = useState(true);
  const [validationError, setValidationError] = useState<string>('');

  const initialNodes: Node[] = useMemo(() => {
    const nodes = (initialWorkflowJson?.nodes ?? []) as Array<{
      id: string;
      type: string;
      config?: unknown;
    }>;
    if (!nodes.length) return [];
    return nodes.map((n, idx) => ({
      id: n.id,
      type: 'default',
      position: { x: 150 + idx * 40, y: 80 + idx * 40 },
      data: {
        label: nodeTypes.find(t => t.type === n.type)?.label || n.type,
        type: n.type,
        config: n.config ?? {},
        icon: nodeTypes.find(t => t.type === n.type)?.icon || Zap,
        color: nodeTypes.find(t => t.type === n.type)?.color || '#6b7280',
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

  const handleAddNode = (type: typeof nodeTypes[number]) => {
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
      setValidationError('');
      setIsValid(true);
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Invalid JSON configuration"
      );
      setValidationError(err instanceof Error ? err.message : "Invalid JSON configuration");
      setIsValid(false);
    }
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
      
      const triggerNodes = nodes.filter(n => n.data.type === 'webhook');
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
      
      await workflowsApi.update(workflow.id, { workflowJson });
      setSaveSuccess(true);
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Failed to save workflow"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNode = (nodeId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => 
      eds.filter((e) => e.source !== nodeId && e.target !== nodeId)
    );
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
  };

  const handleDuplicateNode = (node: Node) => {
    const newNode = {
      ...node,
      id: `${node.data.type}-${Date.now()}-copy`,
      position: { x: node.position.x + 20, y: node.position.y + 20 },
    };
    setNodes((nds) => [...nds, newNode]);
  };

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
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 neon-border"
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
            <div className="w-64 border-r border-white/10 p-4 space-y-4 bg-slate-900/50 backdrop-blur-sm">
              <div>
                <h3 className="text-sm font-semibold text-white mb-3">Nodes</h3>
                <div className="space-y-2">
                  {nodeTypes.map((nodeType) => (
                    <motion.button
                      key={nodeType.type}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleAddNode(nodeType)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl glass border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-300"
                    >
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${nodeType.color}20`, border: `1px solid ${nodeType.color}50` }}
                      >
                        <nodeType.icon className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-sm font-medium text-white">{nodeType.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="border-t border-white/10 pt-4">
                <h3 className="text-sm font-semibold text-white mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg glass border border-white/10 hover:bg-white/10 transition-all duration-300">
                    <Copy className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-300">Duplicate All</span>
                  </button>
                  <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg glass border border-red-500/20 hover:bg-red-500/30 transition-all duration-300">
                    <Trash2 className="h-4 w-4 text-red-400" />
                    <span className="text-sm text-red-300">Clear All</span>
                  </button>
                </div>
              </div>
            </div>

            {/* React Flow Canvas */}
            <div className="flex-1 relative bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
              <ReactFlowProvider>
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  fitView
                  onNodeClick={(_, node) => handleSelectNode(node)}
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
                    maskBorderRadius={8}
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
            <div className="w-80 border-l border-white/10 p-4 bg-slate-900/50 backdrop-blur-sm flex flex-col">
              <div>
                <h3 className="text-sm font-semibold text-white mb-3">Node Configuration</h3>
                {selectedNode ? (
                  <>
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div 
                          className="w-6 h-6 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${selectedNode.data.color}20`, border: `1px solid ${selectedNode.data.color}50` }}
                        >
                          <selectedNode.data.icon className="h-3 w-3 text-white" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">
                            {selectedNode.data.label}
                          </div>
                          <div className="text-xs text-gray-400">
                            {selectedNode.id}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">
                          Configuration (JSON)
                        </label>
                        <textarea
                          className={`w-full h-32 text-xs bg-slate-950/60 border ${
                            isValid 
                              ? 'border-white/10 focus:border-purple-500/50' 
                              : 'border-red-500/50 focus:border-red-500/50'
                          } rounded-lg p-2 font-mono text-slate-100 resize-none focus:outline-none transition-all duration-300`}
                          value={configText}
                          onChange={(e) => setConfigText(e.target.value)}
                          placeholder="Enter valid JSON configuration"
                        />
                        {validationError && (
                          <div className="mt-1 p-2 rounded-lg bg-red-500/10 border border-red-500/30">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 text-red-400" />
                              <span className="text-xs text-red-300">{validationError}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleConfigApply}
                          className="flex-1 px-3 py-2 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all duration-300 disabled:opacity-50"
                        >
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-xs font-medium">Apply</span>
                        </motion.button>
                        
                        {selectedNode && (
                          <>
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleDuplicateNode(selectedNode)}
                              className="px-3 py-2 rounded-lg glass border border-white/10 hover:bg-white/10 transition-all duration-300"
                            >
                              <Copy className="h-4 w-4 text-gray-400" />
                              <span className="text-xs font-medium">Duplicate</span>
                            </motion.button>
                            
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleDeleteNode(selectedNode.id)}
                              className="px-3 py-2 rounded-lg bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 transition-all duration-300"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="text-xs font-medium">Delete</span>
                            </motion.button>
                          </>
                        )}
                      </div>
                    </>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 rounded-full bg-gray-500/20 border border-gray-500/30 flex items-center justify-center mx-auto mb-3">
                      <Info className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-400">
                      Select a node to edit configuration
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
