import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  AlertCircle, 
  Copy, 
  Trash2, 
  Settings,
  Info,
  Save,
  X
} from 'lucide-react';
import { Node } from 'reactflow';

interface NodeConfigPanelProps {
  selectedNode: Node | null;
  onConfigUpdate: (nodeId: string, config: any) => void;
  onNodeDelete: (nodeId: string) => void;
  onNodeDuplicate: (node: Node) => void;
}

export const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({
  selectedNode,
  onConfigUpdate,
  onNodeDelete,
  onNodeDuplicate,
}) => {
  const [configText, setConfigText] = useState<string>("{}");
  const [isValid, setIsValid] = useState(true);
  const [validationError, setValidationError] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (selectedNode?.data?.config) {
      setConfigText(JSON.stringify(selectedNode.data.config, null, 2));
    } else {
      setConfigText("{}");
    }
    setIsValid(true);
    setValidationError('');
  }, [selectedNode]);

  const handleConfigApply = () => {
    if (!selectedNode) return;
    
    try {
      const parsed = configText.trim() ? JSON.parse(configText) : {};
      onConfigUpdate(selectedNode.id, parsed);
      setIsValid(true);
      setValidationError('');
      setIsEditing(false);
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : "Invalid JSON configuration");
      setIsValid(false);
    }
  };

  const handleConfigChange = (value: string) => {
    setConfigText(value);
    setIsEditing(true);
    
    // Real-time validation
    try {
      if (value.trim()) {
        JSON.parse(value);
      }
      setIsValid(true);
      setValidationError('');
    } catch (err) {
      setIsValid(false);
      setValidationError(err instanceof Error ? err.message : "Invalid JSON");
    }
  };

  const handleSave = () => {
    if (isEditing) {
      handleConfigApply();
    }
  };

  const handleReset = () => {
    if (selectedNode?.data?.config) {
      setConfigText(JSON.stringify(selectedNode.data.config, null, 2));
    } else {
      setConfigText("{}");
    }
    setIsValid(true);
    setValidationError('');
    setIsEditing(false);
  };

  if (!selectedNode) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-8">
        <div className="w-12 h-12 rounded-full bg-gray-500/20 border border-gray-500/30 flex items-center justify-center mb-3">
          <Info className="h-6 w-6 text-gray-400" />
        </div>
        <p className="text-sm text-gray-400">
          Select a node to edit configuration
        </p>
      </div>
    );
  }

  const Icon = selectedNode.data.icon;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <div 
            className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ 
              backgroundColor: `${selectedNode.data.color}20`, 
              border: `1px solid ${selectedNode.data.color}50` 
            }}
          >
            <Icon className="h-3 w-3 text-white" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-white">
              {selectedNode.data.label}
            </div>
            <div className="text-xs text-gray-400">
              {selectedNode.id}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onNodeDuplicate(selectedNode)}
              className="p-1 rounded hover:bg-white/10 transition-colors"
              title="Duplicate node"
            >
              <Copy className="h-3 w-3 text-gray-400" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onNodeDelete(selectedNode.id)}
              className="p-1 rounded hover:bg-red-500/20 transition-colors"
              title="Delete node"
            >
              <Trash2 className="h-3 w-3 text-red-400" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Configuration Editor */}
      <div className="flex-1 flex flex-col space-y-3">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-gray-300">
              Configuration (JSON)
            </label>
            <AnimatePresence>
              {isEditing && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-2"
                >
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSave}
                    className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all duration-300"
                  >
                    <Save className="h-3 w-3" />
                    <span className="text-xs">Save</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleReset}
                    className="px-2 py-1 rounded bg-gray-500/20 text-gray-300 border border-gray-500/30 hover:bg-gray-500/30 transition-all duration-300"
                  >
                    <X className="h-3 w-3" />
                    <span className="text-xs">Reset</span>
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <textarea
            className={`w-full h-40 text-xs bg-slate-950/60 border rounded-lg p-2 font-mono text-slate-100 resize-none focus:outline-none transition-all duration-300 ${
              isValid 
                ? 'border-white/10 focus:border-purple-500/50' 
                : 'border-red-500/50 focus:border-red-500/50'
            }`}
            value={configText}
            onChange={(e) => handleConfigChange(e.target.value)}
            placeholder="Enter valid JSON configuration"
            spellCheck={false}
          />
          
          <AnimatePresence>
            {validationError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-2 rounded-lg bg-red-500/10 border border-red-500/30"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                  <span className="text-xs text-red-300">{validationError}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Node Type Information */}
        <div className="border-t border-white/10 pt-3">
          <div className="text-xs font-medium text-gray-300 mb-2">Node Type</div>
          <div className="flex items-center gap-2">
            <div 
              className="w-4 h-4 rounded flex items-center justify-center"
              style={{ 
                backgroundColor: `${selectedNode.data.color}20`, 
                border: `1px solid ${selectedNode.data.color}50` 
              }}
            >
              <Icon className="h-2 w-2 text-white" />
            </div>
            <span className="text-xs text-gray-400">{selectedNode.data.type}</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="border-t border-white/10 pt-3">
          <div className="text-xs font-medium text-gray-300 mb-2">Quick Actions</div>
          <div className="space-y-1">
            <button className="w-full flex items-center gap-2 px-2 py-1 rounded glass border border-white/10 hover:bg-white/10 transition-all duration-300 text-left">
              <Settings className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-300">Advanced Settings</span>
            </button>
            <button className="w-full flex items-center gap-2 px-2 py-1 rounded glass border border-white/10 hover:bg-white/10 transition-all duration-300 text-left">
              <Copy className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-300">Copy Configuration</span>
            </button>
          </div>
        </div>

        {/* Status */}
        <div className="border-t border-white/10 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Status</span>
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${
                isValid ? 'bg-emerald-500' : 'bg-red-500'
              }`}></div>
              <span className={`text-xs ${
                isValid ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {isValid ? 'Valid' : 'Invalid'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
