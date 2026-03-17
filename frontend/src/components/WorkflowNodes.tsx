import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { motion } from 'framer-motion';
import { 
  Globe, 
  Clock, 
  Mail, 
  Send, 
  Database, 
  RefreshCw, 
  Zap 
} from 'lucide-react';

export interface CustomNodeData {
  label: string;
  type: string;
  config: any;
  icon: React.ComponentType<any>;
  color: string;
}

export const TriggerNode: React.FC<NodeProps<CustomNodeData>> = ({ data, selected }) => {
  const Icon = data.icon;
  
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`relative px-4 py-3 rounded-xl border-2 backdrop-blur-sm transition-all duration-300 ${
        selected 
          ? 'border-white/50 shadow-lg shadow-white/20' 
          : 'border-white/20 hover:border-white/30 hover:shadow-lg'
      }`}
      style={{
        backgroundColor: `${data.color}15`,
        borderColor: selected ? data.color : `${data.color}30`,
      }}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-white/50 border-2 border-white"
      />
      
      {/* Node Content */}
      <div className="flex items-center gap-3">
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${data.color}20`, border: `1px solid ${data.color}50` }}
        >
          <Icon className="h-4 w-4 text-white" />
        </div>
        <div>
          <div className="text-sm font-semibold text-white">{data.label}</div>
          <div className="text-xs text-gray-400">Trigger</div>
        </div>
      </div>
      
      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-white/50 border-2 border-white"
      />
      
      {/* Status Indicator */}
      <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900"></div>
    </motion.div>
  );
};

export const ActionNode: React.FC<NodeProps<CustomNodeData>> = ({ data, selected }) => {
  const Icon = data.icon;
  
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`relative px-4 py-3 rounded-xl border-2 backdrop-blur-sm transition-all duration-300 ${
        selected 
          ? 'border-white/50 shadow-lg shadow-white/20' 
          : 'border-white/20 hover:border-white/30 hover:shadow-lg'
      }`}
      style={{
        backgroundColor: `${data.color}15`,
        borderColor: selected ? data.color : `${data.color}30`,
      }}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-white/50 border-2 border-white"
      />
      
      {/* Node Content */}
      <div className="flex items-center gap-3">
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${data.color}20`, border: `1px solid ${data.color}50` }}
        >
          <Icon className="h-4 w-4 text-white" />
        </div>
        <div>
          <div className="text-sm font-semibold text-white">{data.label}</div>
          <div className="text-xs text-gray-400">Action</div>
        </div>
      </div>
      
      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-white/50 border-2 border-white"
      />
      
      {/* Status Indicator */}
      <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-slate-900"></div>
    </motion.div>
  );
};

export const WebhookNode: React.FC<NodeProps<CustomNodeData>> = ({ data, selected }) => {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`relative px-4 py-3 rounded-xl border-2 backdrop-blur-sm transition-all duration-300 ${
        selected 
          ? 'border-blue-500/50 shadow-lg shadow-blue-500/20' 
          : 'border-blue-500/30 hover:border-blue-500/40 hover:shadow-lg'
      }`}
      style={{
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        borderColor: selected ? '#3b82f6' : 'rgba(59, 130, 246, 0.3)',
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-blue-500/50 border-2 border-blue-500"
      />
      
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-500/20 border border-blue-500/30">
          <Globe className="h-4 w-4 text-blue-400" />
        </div>
        <div>
          <div className="text-sm font-semibold text-white">{data.label}</div>
          <div className="text-xs text-blue-400">Webhook</div>
        </div>
      </div>
      
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-blue-500/50 border-2 border-blue-500"
      />
      
      <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900"></div>
    </motion.div>
  );
};

export const CronNode: React.FC<NodeProps<CustomNodeData>> = ({ data, selected }) => {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`relative px-4 py-3 rounded-xl border-2 backdrop-blur-sm transition-all duration-300 ${
        selected 
          ? 'border-purple-500/50 shadow-lg shadow-purple-500/20' 
          : 'border-purple-500/30 hover:border-purple-500/40 hover:shadow-lg'
      }`}
      style={{
        backgroundColor: 'rgba(139, 92, 246, 0.15)',
        borderColor: selected ? '#8b5cf6' : 'rgba(139, 92, 246, 0.3)',
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-purple-500/50 border-2 border-purple-500"
      />
      
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-purple-500/20 border border-purple-500/30">
          <Clock className="h-4 w-4 text-purple-400" />
        </div>
        <div>
          <div className="text-sm font-semibold text-white">{data.label}</div>
          <div className="text-xs text-purple-400">Cron</div>
        </div>
      </div>
      
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-purple-500/50 border-2 border-purple-500"
      />
      
      <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900"></div>
    </motion.div>
  );
};

export const EmailNode: React.FC<NodeProps<CustomNodeData>> = ({ data, selected }) => {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`relative px-4 py-3 rounded-xl border-2 backdrop-blur-sm transition-all duration-300 ${
        selected 
          ? 'border-emerald-500/50 shadow-lg shadow-emerald-500/20' 
          : 'border-emerald-500/30 hover:border-emerald-500/40 hover:shadow-lg'
      }`}
      style={{
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        borderColor: selected ? '#10b981' : 'rgba(16, 185, 129, 0.3)',
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-emerald-500/50 border-2 border-emerald-500"
      />
      
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-500/20 border border-emerald-500/30">
          <Mail className="h-4 w-4 text-emerald-400" />
        </div>
        <div>
          <div className="text-sm font-semibold text-white">{data.label}</div>
          <div className="text-xs text-emerald-400">Email</div>
        </div>
      </div>
      
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-emerald-500/50 border-2 border-emerald-500"
      />
      
      <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-slate-900"></div>
    </motion.div>
  );
};

export const HttpRequestNode: React.FC<NodeProps<CustomNodeData>> = ({ data, selected }) => {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`relative px-4 py-3 rounded-xl border-2 backdrop-blur-sm transition-all duration-300 ${
        selected 
          ? 'border-amber-500/50 shadow-lg shadow-amber-500/20' 
          : 'border-amber-500/30 hover:border-amber-500/40 hover:shadow-lg'
      }`}
      style={{
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        borderColor: selected ? '#f59e0b' : 'rgba(245, 158, 11, 0.3)',
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-amber-500/50 border-2 border-amber-500"
      />
      
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-500/20 border border-amber-500/30">
          <Send className="h-4 w-4 text-amber-400" />
        </div>
        <div>
          <div className="text-sm font-semibold text-white">{data.label}</div>
          <div className="text-xs text-amber-400">HTTP Request</div>
        </div>
      </div>
      
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-amber-500/50 border-2 border-amber-500"
      />
      
      <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-slate-900"></div>
    </motion.div>
  );
};

export const TelegramNode: React.FC<NodeProps<CustomNodeData>> = ({ data, selected }) => {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`relative px-4 py-3 rounded-xl border-2 backdrop-blur-sm transition-all duration-300 ${
        selected 
          ? 'border-cyan-500/50 shadow-lg shadow-cyan-500/20' 
          : 'border-cyan-500/30 hover:border-cyan-500/40 hover:shadow-lg'
      }`}
      style={{
        backgroundColor: 'rgba(6, 182, 212, 0.15)',
        borderColor: selected ? '#06b6d4' : 'rgba(6, 182, 212, 0.3)',
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-cyan-500/50 border-2 border-cyan-500"
      />
      
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-cyan-500/20 border border-cyan-500/30">
          <Send className="h-4 w-4 text-cyan-400" />
        </div>
        <div>
          <div className="text-sm font-semibold text-white">{data.label}</div>
          <div className="text-xs text-cyan-400">Telegram</div>
        </div>
      </div>
      
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-cyan-500/50 border-2 border-cyan-500"
      />
      
      <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-slate-900"></div>
    </motion.div>
  );
};

export const DatabaseNode: React.FC<NodeProps<CustomNodeData>> = ({ data, selected }) => {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`relative px-4 py-3 rounded-xl border-2 backdrop-blur-sm transition-all duration-300 ${
        selected 
          ? 'border-indigo-500/50 shadow-lg shadow-indigo-500/20' 
          : 'border-indigo-500/30 hover:border-indigo-500/40 hover:shadow-lg'
      }`}
      style={{
        backgroundColor: 'rgba(99, 102, 241, 0.15)',
        borderColor: selected ? '#6366f1' : 'rgba(99, 102, 241, 0.3)',
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-indigo-500/50 border-2 border-indigo-500"
      />
      
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-indigo-500/20 border border-indigo-500/30">
          <Database className="h-4 w-4 text-indigo-400" />
        </div>
        <div>
          <div className="text-sm font-semibold text-white">{data.label}</div>
          <div className="text-xs text-indigo-400">Database</div>
        </div>
      </div>
      
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-indigo-500/50 border-2 border-indigo-500"
      />
      
      <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-slate-900"></div>
    </motion.div>
  );
};

export const DataTransformNode: React.FC<NodeProps<CustomNodeData>> = ({ data, selected }) => {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`relative px-4 py-3 rounded-xl border-2 backdrop-blur-sm transition-all duration-300 ${
        selected 
          ? 'border-purple-500/50 shadow-lg shadow-purple-500/20' 
          : 'border-purple-500/30 hover:border-purple-500/40 hover:shadow-lg'
      }`}
      style={{
        backgroundColor: 'rgba(139, 92, 246, 0.15)',
        borderColor: selected ? '#8b5cf6' : 'rgba(139, 92, 246, 0.3)',
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-purple-500/50 border-2 border-purple-500"
      />
      
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-purple-500/20 border border-purple-500/30">
          <RefreshCw className="h-4 w-4 text-purple-400" />
        </div>
        <div>
          <div className="text-sm font-semibold text-white">{data.label}</div>
          <div className="text-xs text-purple-400">Transform</div>
        </div>
      </div>
      
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-purple-500/50 border-2 border-purple-500"
      />
      
      <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-slate-900"></div>
    </motion.div>
  );
};

// Node type mapping
export const nodeTypes = {
  webhook: WebhookNode,
  cron: CronNode,
  email: EmailNode,
  http_request: HttpRequestNode,
  telegram: TelegramNode,
  database: DatabaseNode,
  data_transform: DataTransformNode,
};
