import React, { useEffect, useState } from "react";
import {
  BarChart3,
  Clock,
  Activity,
  Zap,
  CheckCircle,
  XCircle,
  PauseCircle,
  RefreshCw,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { api } from "../api/client";
import { runsApi, WorkflowRun } from "../api/runs";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface DashboardData {
  total: number;
  successful: number;
  failed: number;
  paused: number;
  avgExecutionTime: number;
  slowestStep: { nodeType: string; duration: number } | null;
  runsOverTime: { time: string; value: number }[];
  pieData: { name: string; value: number; color: string }[];
  recentActivity: { userName: string; action: string; time: string }[];
  totalChange: number;
  successfulChange: number;
  failedChange: number;
  pausedChange: number;
}

/* ------------------------------------------------------------------ */
/*  Helper – build dashboard from /api/runs (fallback)                 */
/* ------------------------------------------------------------------ */
function buildFromRuns(runs: WorkflowRun[]): DashboardData {
  const total = runs.length;
  const successful = runs.filter((r) => r.status === "completed").length;
  const failedCount = runs.filter((r) => r.status === "failed").length;
  const paused = runs.filter(
    (r) => r.status === "pending" || r.status === "running"
  ).length;

  // avg execution time
  let sumMs = 0;
  let cnt = 0;
  for (const r of runs) {
    if (r.startedAt && r.finishedAt) {
      sumMs += new Date(r.finishedAt).getTime() - new Date(r.startedAt).getTime();
      cnt++;
    }
  }
  const avgExecutionTime = cnt > 0 ? Math.round(sumMs / cnt) : 0;

  // slowest step
  let slowestStep: { nodeType: string; duration: number } | null = null;
  for (const r of runs) {
    for (const s of r.steps ?? []) {
      if (s.duration && (!slowestStep || s.duration > slowestStep.duration)) {
        slowestStep = { nodeType: s.nodeType || "unknown", duration: s.duration };
      }
    }
  }

  // runs-over-time last 7 days
  const now = new Date();
  const runsOverTime: { time: string; value: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().split("T")[0];
    const label = d.toLocaleDateString("en-US", { weekday: "short" });
    const count = runs.filter((r) => r.startedAt?.startsWith(iso)).length;
    runsOverTime.push({ time: label, value: count });
  }

  // pie
  const pieData = [
    { name: "Successful", value: successful, color: "#10B981" },
    { name: "Failed", value: failedCount, color: "#EF4444" },
    { name: "Pending", value: paused, color: "#F59E0B" },
  ];

  // recent activity
  const recentActivity = runs.slice(0, 10).map((r) => ({
    userName: r.workflowName || "Workflow",
    action:
      r.status === "completed"
        ? `Completed: ${r.workflowName}`
        : r.status === "failed"
          ? `Failed: ${r.workflowName}`
          : `Started: ${r.workflowName}`,
    time: r.startedAt || new Date().toISOString(),
  }));

  return {
    total,
    successful,
    failed: failedCount,
    paused,
    avgExecutionTime,
    slowestStep,
    runsOverTime,
    pieData,
    recentActivity,
    totalChange: 0,
    successfulChange: 0,
    failedChange: 0,
    pausedChange: 0,
  };
}

/* ------------------------------------------------------------------ */
/*  Skeleton loader                                                    */
/* ------------------------------------------------------------------ */
const Skeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="theme-card border theme-border rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-slate-800" />
            <div className="space-y-2">
              <div className="w-24 h-4 bg-gray-200 dark:bg-slate-800 rounded" />
              <div className="w-16 h-6 bg-gray-200 dark:bg-slate-800 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="theme-card border theme-border rounded-2xl p-6">
          <div className="w-32 h-6 bg-gray-200 dark:bg-slate-800 rounded mb-4" />
          <div className="w-full h-64 bg-gray-100 dark:bg-slate-800/50 rounded-xl" />
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="theme-card border theme-border rounded-2xl p-6">
          <div className="w-40 h-6 bg-gray-200 dark:bg-slate-800 rounded mb-4" />
          <div className="space-y-3">
            {[...Array(5)].map((__, j) => (
              <div key={j} className="h-12 bg-gray-100 dark:bg-slate-800/50 rounded-lg" />
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/*  KPI Card                                                           */
/* ------------------------------------------------------------------ */
const KPICard: React.FC<{
  title: string;
  value: number;
  change: number;
  icon: React.ReactNode;
  accent: string;
}> = ({ title, value, change, icon, accent }) => {
  const arrow = change > 0 ? "↑" : change < 0 ? "↓" : "";
  const changeColor =
    change > 0 ? "text-emerald-400" : change < 0 ? "text-red-400" : "text-gray-500";

  return (
    <div className="group theme-card backdrop-blur-sm border theme-border rounded-2xl p-5 hover:border-purple-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/[0.04] theme-transition">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-[13px] font-medium theme-text-secondary tracking-wide uppercase">
            {title}
          </p>
          <p className="text-3xl font-bold theme-text tabular-nums">{value}</p>
        </div>
        <div
          className={`w-11 h-11 rounded-xl bg-opacity-10 flex items-center justify-center ${accent}`}
          style={{ backgroundColor: "currentColor", opacity: 0.12 }}
        >
          <div className={accent}>{icon}</div>
        </div>
      </div>
      {change !== 0 && (
        <p className={`mt-3 text-xs font-medium ${changeColor}`}>
          {arrow} {Math.abs(change)}% vs last period
        </p>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Custom Tooltip for recharts                                        */
/* ------------------------------------------------------------------ */
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="theme-card border theme-border rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs theme-text-muted">{label}</p>
      <p className="text-sm font-semibold theme-text">{payload[0].value} runs</p>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Pie label                                                          */
/* ------------------------------------------------------------------ */
const RADIAN = Math.PI / 180;
const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent === 0) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" className="text-xs font-semibold">
      {(percent * 100).toFixed(0)}%
    </text>
  );
};

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */
export const StatsPage: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Try stats API first
      const res = await api.get("/stats");
      const s = res.data;
      const runsOT =
        s.runsOverTime?.length > 0
          ? s.runsOverTime
          : [
            { time: "Mon", value: 0 },
            { time: "Tue", value: 0 },
            { time: "Wed", value: 0 },
            { time: "Thu", value: 0 },
            { time: "Fri", value: 0 },
            { time: "Sat", value: 0 },
            { time: "Sun", value: 0 },
          ];
      setData({
        ...s,
        runsOverTime: runsOT,
        pieData: [
          { name: "Successful", value: s.successful ?? 0, color: "#10B981" },
          { name: "Failed", value: s.failed ?? 0, color: "#EF4444" },
          { name: "Pending", value: s.paused ?? 0, color: "#F59E0B" },
        ],
        recentActivity: s.recentActivity ?? [],
      });
    } catch {
      // Fallback: build from /api/runs
      try {
        const runs = await runsApi.list();
        setData(buildFromRuns(runs));
      } catch {
        setData(buildFromRuns([]));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <Skeleton />;
  if (!data) return null;

  const hasData = data.total > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold theme-text flex items-center gap-3">
            <BarChart3 className="w-7 h-7 text-purple-400" />
            Analytics
          </h1>
          <p className="theme-text-muted text-sm mt-1">
            Monitor your workflow performance
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-3 py-2 rounded-lg theme-card border theme-border text-sm theme-text-secondary hover:theme-text transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Runs"
          value={data.total}
          change={data.totalChange}
          icon={<Zap className="w-5 h-5" />}
          accent="text-purple-400"
        />
        <KPICard
          title="Successful"
          value={data.successful}
          change={data.successfulChange}
          icon={<CheckCircle className="w-5 h-5" />}
          accent="text-emerald-400"
        />
        <KPICard
          title="Failed"
          value={data.failed}
          change={data.failedChange}
          icon={<XCircle className="w-5 h-5" />}
          accent="text-red-400"
        />
        <KPICard
          title="Pending"
          value={data.paused}
          change={data.pausedChange}
          icon={<PauseCircle className="w-5 h-5" />}
          accent="text-amber-400"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Line chart – 2/3 */}
        <div className="lg:col-span-2 theme-card backdrop-blur-sm border theme-border rounded-2xl p-5 theme-transition">
          <h3 className="text-sm font-semibold theme-text mb-4">Runs Over Time</h3>
          {hasData ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data.runsOverTime}>
                <defs>
                  <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="time" stroke="#64748B" tick={{ fill: "#94A3B8", fontSize: 12 }} />
                <YAxis stroke="#64748B" tick={{ fill: "#94A3B8", fontSize: 12 }} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#8B5CF6"
                  strokeWidth={2.5}
                  dot={{ fill: "#8B5CF6", r: 4, strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: "#A78BFA" }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[280px] text-gray-600 text-sm">
              No run data yet. Execute a workflow to see trends.
            </div>
          )}
        </div>

        {/* Pie chart – 1/3 */}
        <div className="theme-card backdrop-blur-sm border theme-border rounded-2xl p-5 theme-transition">
          <h3 className="text-sm font-semibold theme-text mb-4">Success Rate</h3>
          {hasData ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={data.pieData}
                  cx="50%"
                  cy="45%"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  labelLine={false}
                  label={renderPieLabel}
                >
                  {data.pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 12, color: "#94A3B8" }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[280px] text-gray-600 text-sm">
              No data available
            </div>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Performance */}
        <div className="theme-card backdrop-blur-sm border theme-border rounded-2xl p-5 theme-transition">
          <h3 className="text-sm font-semibold theme-text mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-400" />
            Performance
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b theme-border-light">
              <span className="theme-text-secondary text-sm">Avg Execution Time</span>
              <span className="theme-text font-semibold tabular-nums text-sm">
                {data.avgExecutionTime > 0
                  ? data.avgExecutionTime > 1000
                    ? `${(data.avgExecutionTime / 1000).toFixed(1)}s`
                    : `${data.avgExecutionTime}ms`
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b theme-border-light">
              <span className="theme-text-secondary text-sm">Slowest Step</span>
              <span className="theme-text font-semibold text-sm">
                {data.slowestStep
                  ? `${data.slowestStep.nodeType} (${(data.slowestStep.duration / 1000).toFixed(1)}s)`
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b theme-border-light">
              <span className="theme-text-secondary text-sm">Success Rate</span>
              <span className="text-emerald-400 font-semibold text-sm">
                {data.total > 0
                  ? `${((data.successful / data.total) * 100).toFixed(1)}%`
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="theme-text-secondary text-sm">Failure Rate</span>
              <span className="text-red-400 font-semibold text-sm">
                {data.total > 0
                  ? `${((data.failed / data.total) * 100).toFixed(1)}%`
                  : "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="theme-card backdrop-blur-sm border theme-border rounded-2xl p-5 theme-transition">
          <h3 className="text-sm font-semibold theme-text mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-400" />
            Recent Activity
          </h3>
          {data.recentActivity.length > 0 ? (
            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
              {data.recentActivity.slice(0, 10).map((a, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-100 dark:bg-slate-800/40 hover:bg-gray-200 dark:hover:bg-slate-800/70 transition-colors"
                >
                  <div className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20 flex items-center justify-center">
                    <span className="text-[11px] text-purple-300 font-bold">
                      {a.userName[0]?.toUpperCase() || "?"}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="theme-text text-sm truncate">{a.action}</p>
                    <p className="theme-text-muted text-xs">
                      {new Date(a.time).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-gray-600 text-sm">
              No recent activity
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
