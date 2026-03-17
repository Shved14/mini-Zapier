import React from 'react';
import { motion } from 'framer-motion';
import { 
  Globe, 
  Clock, 
  Mail, 
  Send, 
  Database, 
  RefreshCw 
} from 'lucide-react';

export interface NodeType {
  type: string;
  label: string;
  icon: React.ComponentType<any>;
  color: string;
  description: string;
}

const nodeTypes: NodeType[] = [
  {
    type: 'webhook',
    label: 'Webhook',
    icon: Globe,
    color: '#3b82f6',
    description: 'Receive HTTP webhooks to trigger workflows'
  },
  {
    type: 'cron',
    label: 'Cron',
    icon: Clock,
    color: '#8b5cf6',
    description: 'Schedule workflows with cron expressions'
  },
  {
    type: 'email',
    label: 'Email',
    icon: Mail,
    color: '#10b981',
    description: 'Send email notifications'
  },
  {
    type: 'http_request',
    label: 'HTTP Request',
    icon: Send,
    color: '#f59e0b',
    description: 'Make HTTP requests to external APIs'
  },
  {
    type: 'telegram',
    label: 'Telegram',
    icon: Send,
    color: '#22c55e',
    description: 'Send messages to Telegram bots'
  },
  {
    type: 'database',
    label: 'Database',
    icon: Database,
    color: '#06b6d4',
    description: 'Perform database operations'
  },
  {
    type: 'data_transform',
    label: 'Transform',
    icon: RefreshCw,
    color: '#8b5cf6',
    description: 'Transform and manipulate data'
  },
];

interface NodePanelProps {
  onNodeSelect: (nodeType: NodeType) => void;
  className?: string;
}

export const NodePanel: React.FC<NodePanelProps> = ({ onNodeSelect, className = '' }) => {
  const handleDragStart = (e: React.DragEvent, nodeType: NodeType) => {
    e.dataTransfer.setData('application/reactflow', JSON.stringify(nodeType));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleClick = (nodeType: NodeType) => {
    onNodeSelect(nodeType);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Nodes</h3>
        
        {/* Trigger Nodes */}
        <div className="mb-4">
          <h4 className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">Triggers</h4>
          <div className="space-y-2">
            {nodeTypes.filter(n => ['webhook', 'cron'].includes(n.type)).map((nodeType) => (
              <motion.div
                key={nodeType.type}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                draggable
                onDragStart={(e) => handleDragStart(e, nodeType)}
                onClick={() => handleClick(nodeType)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl glass border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-300 cursor-move"
              >
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${nodeType.color}20`, border: `1px solid ${nodeType.color}50` }}
                >
                  <nodeType.icon className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">{nodeType.label}</div>
                  <div className="text-xs text-gray-400">{nodeType.description}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Action Nodes */}
        <div>
          <h4 className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">Actions</h4>
          <div className="space-y-2">
            {nodeTypes.filter(n => !['webhook', 'cron'].includes(n.type)).map((nodeType) => (
              <motion.div
                key={nodeType.type}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                draggable
                onDragStart={(e) => handleDragStart(e, nodeType)}
                onClick={() => handleClick(nodeType)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl glass border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-300 cursor-move"
              >
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${nodeType.color}20`, border: `1px solid ${nodeType.color}50` }}
                >
                  <nodeType.icon className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">{nodeType.label}</div>
                  <div className="text-xs text-gray-400">{nodeType.description}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="border-t border-white/10 pt-4">
        <h4 className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">Quick Actions</h4>
        <div className="space-y-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg glass border border-white/10 hover:bg-white/10 transition-all duration-300"
          >
            <RefreshCw className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-300">Duplicate All</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg glass border border-red-500/20 hover:bg-red-500/30 transition-all duration-300"
          >
            <RefreshCw className="h-4 w-4 text-red-400" />
            <span className="text-sm text-red-300">Clear All</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default NodePanel;
