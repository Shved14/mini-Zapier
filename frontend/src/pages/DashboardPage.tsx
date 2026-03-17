import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  Area,
  AreaChart
} from 'recharts';
import { 
  Activity, 
  Zap, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  Play,
  Pause,
  Settings,
  Calendar,
  Filter,
  Search,
  ChevronRight,
  MoreVertical
} from 'lucide-react';

// Mock data
const mockWorkflows = [
  {
    id: '1',
    name: 'Order Processing',
    status: 'active',
    executions: 1247,
    successRate: 98.5,
    lastRun: '2 min ago',
    triggerType: 'webhook'
  },
  {
    id: '2',
    name: 'Email Notifications',
    status: 'active',
    executions: 892,
    successRate: 99.2,
    lastRun: '5 min ago',
    triggerType: 'cron'
  },
  {
    id: '3',
    name: 'Data Sync',
    status: 'paused',
    executions: 456,
    successRate: 95.8,
    lastRun: '1 hour ago',
    triggerType: 'manual'
  },
  {
    id: '4',
    name: 'Customer Onboarding',
    status: 'active',
    executions: 2341,
    successRate: 97.1,
    lastRun: '30 min ago',
    triggerType: 'webhook'
  }
];

const mockExecutions = [
  {
    id: '1',
    workflowName: 'Order Processing',
    status: 'success',
    duration: 1250,
    timestamp: '2024-01-15T10:30:00Z',
    error: null
  },
  {
    id: '2',
    workflowName: 'Email Notifications',
    status: 'failed',
    duration: 890,
    timestamp: '2024-01-15T10:25:00Z',
    error: 'SMTP connection timeout'
  },
  {
    id: '3',
    workflowName: 'Data Sync',
    status: 'success',
    duration: 2100,
    timestamp: '2024-01-15T10:20:00Z',
    error: null
  },
  {
    id: '4',
    workflowName: 'Customer Onboarding',
    status: 'success',
    duration: 3400,
    timestamp: '2024-01-15T10:15:00Z',
    error: null
  },
  {
    id: '5',
    workflowName: 'Order Processing',
    status: 'running',
    duration: null,
    timestamp: '2024-01-15T10:32:00Z',
    error: null
  }
];

const mockLogs = [
  {
    id: '1',
    level: 'info',
    message: 'Workflow "Order Processing" started',
    timestamp: '2024-01-15T10:30:00Z',
    workflowId: '1'
  },
  {
    id: '2',
    level: 'error',
    message: 'SMTP connection timeout',
    timestamp: '2024-01-15T10:25:00Z',
    workflowId: '2'
  },
  {
    id: '3',
    level: 'info',
    message: 'Data sync completed successfully',
    timestamp: '2024-01-15T10:20:00Z',
    workflowId: '3'
  },
  {
    id: '4',
    level: 'warning',
    message: 'Rate limit approaching for API calls',
    timestamp: '2024-01-15T10:18:00Z',
    workflowId: '1'
  }
];

const chartData = [
  { name: 'Mon', executions: 120, success: 118, failed: 2 },
  { name: 'Tue', executions: 145, success: 142, failed: 3 },
  { name: 'Wed', executions: 98, success: 96, failed: 2 },
  { name: 'Thu', executions: 167, success: 163, failed: 4 },
  { name: 'Fri', executions: 189, success: 185, failed: 4 },
  { name: 'Sat', executions: 134, success: 131, failed: 3 },
  { name: 'Sun', executions: 89, success: 87, failed: 2 },
];

const pieData = [
  { name: 'Success', value: 85, color: '#10b981' },
  { name: 'Failed', value: 10, color: '#ef4444' },
  { name: 'Running', value: 5, color: '#3b82f6' },
];

export const DashboardPage: React.FC = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);

  const stats = {
    totalExecutions: mockWorkflows.reduce((acc, w) => acc + w.executions, 0),
    avgSuccessRate: mockWorkflows.reduce((acc, w) => acc + w.successRate, 0) / mockWorkflows.length,
    activeWorkflows: mockWorkflows.filter(w => w.status === 'active').length,
    failedExecutions: mockExecutions.filter(e => e.status === 'failed').length
  };

  return (
    <div className="min-h-screen bg-gradient-dark text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
            <p className="text-gray-400">Monitor your workflows and execution history</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search workflows..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-xl glass border border-white/10 bg-white/5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300"
              />
            </div>
            
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="px-4 py-2 rounded-xl glass border border-white/10 bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300"
            >
              <option value="24h">Last 24h</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="p-6 rounded-2xl glass border border-white/10 hover:border-white/20 transition-all duration-300 hover-glow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-blue-500/20 border border-blue-500/30">
                <Activity className="h-6 w-6 text-blue-400" />
              </div>
              <div className="flex items-center text-green-400 text-sm">
                <TrendingUp className="h-4 w-4 mr-1" />
                +12%
              </div>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Total Executions</p>
              <p className="text-2xl font-bold text-white">{stats.totalExecutions.toLocaleString()}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="p-6 rounded-2xl glass border border-white/10 hover:border-white/20 transition-all duration-300 hover-glow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30">
                <Zap className="h-6 w-6 text-emerald-400" />
              </div>
              <div className="flex items-center text-green-400 text-sm">
                <TrendingUp className="h-4 w-4 mr-1" />
                +2.3%
              </div>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Success Rate</p>
              <p className="text-2xl font-bold text-white">{stats.avgSuccessRate.toFixed(1)}%</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="p-6 rounded-2xl glass border border-white/10 hover:border-white/20 transition-all duration-300 hover-glow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-purple-500/20 border border-purple-500/30">
                <Play className="h-6 w-6 text-purple-400" />
              </div>
              <div className="flex items-center text-yellow-400 text-sm">
                <TrendingUp className="h-4 w-4 mr-1" />
                +1
              </div>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Active Workflows</p>
              <p className="text-2xl font-bold text-white">{stats.activeWorkflows}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="p-6 rounded-2xl glass border border-white/10 hover:border-white/20 transition-all duration-300 hover-glow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30">
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
              <div className="flex items-center text-red-400 text-sm">
                <TrendingDown className="h-4 w-4 mr-1" />
                -5
              </div>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Failed Executions</p>
              <p className="text-2xl font-bold text-white">{stats.failedExecutions}</p>
            </div>
          </motion.div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="lg:col-span-2 p-6 rounded-2xl glass border border-white/10"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Execution Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0,0,0,0.8)', 
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="success" 
                  stroke="#10b981" 
                  fill="#10b981" 
                  fillOpacity={0.3}
                />
                <Area 
                  type="monotone" 
                  dataKey="failed" 
                  stroke="#ef4444" 
                  fill="#ef4444" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="p-6 rounded-2xl glass border border-white/10"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Status Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0,0,0,0.8)', 
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-gray-300">{item.name}</span>
                  </div>
                  <span className="text-white font-medium">{item.value}%</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Workflows Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="p-6 rounded-2xl glass border border-white/10"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Workflows</h3>
            <button className="p-2 rounded-lg glass border border-white/10 hover:bg-white/10 transition-all duration-300">
              <Filter className="h-4 w-4 text-gray-400" />
            </button>
          </div>
          
          <div className="space-y-4">
            {mockWorkflows.map((workflow, index) => (
              <motion.div
                key={workflow.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.8 + index * 0.1 }}
                className="p-4 rounded-xl glass border border-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-xl"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-white font-medium">{workflow.name}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        workflow.status === 'active' 
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                      }`}>
                        {workflow.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>Last run: {workflow.lastRun}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Zap className="h-4 w-4" />
                        <span>{workflow.triggerType}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Activity className="h-4 w-4" />
                        <span>{workflow.executions} executions</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm text-gray-400">Success rate</div>
                      <div className="text-lg font-semibold text-white">{workflow.successRate}%</div>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 rounded-lg glass border border-white/10 hover:bg-emerald-500/20 hover:border-emerald-500/30 transition-all duration-300">
                        <Play className="h-4 w-4 text-emerald-400" />
                      </button>
                      <button className="p-2 rounded-lg glass border border-white/10 hover:bg-gray-500/20 hover:border-gray-500/30 transition-all duration-300">
                        <Pause className="h-4 w-4 text-gray-400" />
                      </button>
                      <button className="p-2 rounded-lg glass border border-white/10 hover:bg-white/10 transition-all duration-300">
                        <Settings className="h-4 w-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Recent Executions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="p-6 rounded-2xl glass border border-white/10"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Recent Executions</h3>
            <button className="p-2 rounded-lg glass border border-white/10 hover:bg-white/10 transition-all duration-300">
              <Calendar className="h-4 w-4 text-gray-400" />
            </button>
          </div>
          
          <div className="space-y-3">
            {mockExecutions.map((execution, index) => (
              <motion.div
                key={execution.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 1.0 + index * 0.1 }}
                className="p-4 rounded-xl glass border border-white/10 hover:border-white/20 transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-white font-medium">{execution.workflowName}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        execution.status === 'success'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : execution.status === 'failed'
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}>
                        {execution.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{new Date(execution.timestamp).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Activity className="h-4 w-4" />
                        <span>{execution.duration ? `${execution.duration}ms` : 'Running...'}</span>
                      </div>
                    </div>
                    {execution.error && (
                      <div className="mt-2 p-2 rounded-lg bg-red-500/10 border border-red-500/30">
                        <p className="text-sm text-red-400">{execution.error}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button className="p-2 rounded-lg glass border border-white/10 hover:bg-white/10 transition-all duration-300">
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </button>
                    <button className="p-2 rounded-lg glass border border-white/10 hover:bg-white/10 transition-all duration-300">
                      <MoreVertical className="h-4 w-4 text-gray-400" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Logs Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.1 }}
          className="p-6 rounded-2xl glass border border-white/10"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">System Logs</h3>
            <button className="p-2 rounded-lg glass border border-white/10 hover:bg-white/10 transition-all duration-300">
              <Filter className="h-4 w-4 text-gray-400" />
            </button>
          </div>
          
          <div className="space-y-2">
            {mockLogs.map((log, index) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 1.2 + index * 0.1 }}
                className="p-3 rounded-lg glass border border-white/10"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-1 rounded ${
                    log.level === 'error' ? 'bg-red-500/20 border border-red-500/30' :
                    log.level === 'warning' ? 'bg-yellow-500/20 border border-yellow-500/30' :
                    'bg-blue-500/20 border border-blue-500/30'
                  }`}>
                    {log.level === 'error' && <AlertTriangle className="h-4 w-4 text-red-400" />}
                    {log.level === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-400" />}
                    {log.level === 'info' && <Activity className="h-4 w-4 text-blue-400" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm">{log.message}</p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                      <span>{new Date(log.timestamp).toLocaleString()}</span>
                      <span>Workflow ID: {log.workflowId}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
