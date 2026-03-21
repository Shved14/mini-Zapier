import React, { useEffect, useState } from "react";
import { Crown, Zap, Check, X, Clock, Infinity as InfinityIcon, Play, LayoutDashboard } from "lucide-react";
import { subscriptionApi, Subscription, SubscriptionUsage } from "../api/subscription";

const PLANS = [
  {
    id: "FREE",
    name: "Free",
    price: "$0",
    period: "forever",
    icon: Zap,
    color: "from-slate-500 to-slate-600",
    features: [
      { text: "1 workflow", included: true },
      { text: "10 runs", included: true },
      { text: "All node types", included: true },
      { text: "Email notifications", included: true },
      { text: "Unlimited workflows", included: false },
      { text: "Unlimited runs", included: false },
      { text: "Priority support", included: false },
    ],
  },
  {
    id: "PRO",
    name: "Pro",
    price: "$19",
    period: "/ month",
    icon: Crown,
    color: "from-purple-500 to-indigo-600",
    popular: true,
    features: [
      { text: "Unlimited workflows", included: true },
      { text: "Unlimited runs", included: true },
      { text: "All node types", included: true },
      { text: "Email notifications", included: true },
      { text: "Priority support", included: true },
      { text: "Advanced analytics", included: true },
      { text: "Team collaboration", included: true },
    ],
  },
];

function isUnlimited(v: number | null | undefined) {
  return !v || v === -1;
}

function UsageBar({ used, max, label, icon: Icon }: { used: number; max: number; label: string; icon: React.FC<any> }) {
  const unlimited = isUnlimited(max);
  const pct = unlimited ? 0 : Math.min(100, Math.round((used / max) * 100));
  const remaining = unlimited ? null : Math.max(0, max - used);
  const atLimit = !unlimited && used >= max;

  return (
    <div className="bg-slate-900/40 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-slate-400" />
          <span className="text-xs text-slate-500 uppercase tracking-wider">{label}</span>
        </div>
        <span className="text-xs text-slate-400">
          {unlimited ? (
            <span className="flex items-center gap-1"><InfinityIcon className="h-3 w-3 text-purple-400" /> Unlimited</span>
          ) : (
            <>{used} / {max}</>
          )}
        </span>
      </div>
      {!unlimited && (
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${atLimit ? "bg-red-500" : pct > 75 ? "bg-amber-500" : "bg-purple-500"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
      <p className="text-sm mt-1.5">
        {unlimited ? (
          <span className="text-purple-400 font-medium">No limit</span>
        ) : atLimit ? (
          <span className="text-red-400 font-medium">Limit reached</span>
        ) : (
          <span className="text-white font-medium">{remaining} remaining</span>
        )}
      </p>
    </div>
  );
}

export const SubscriptionsPage: React.FC = () => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<{ workflows: number; runs: number }>({ workflows: 0, runs: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const data = await subscriptionApi.getWithUsage();
      setSubscription(data.subscription);
      setUsage(data.usage);
    } catch {
      setError("Failed to load subscription");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleActivateTrial = async () => {
    setActionLoading("trial");
    setError(null);
    try {
      const sub = await subscriptionApi.activateTrial();
      setSubscription(sub);
      setSuccess("PRO trial activated! Enjoy 3 days of unlimited access.");
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to activate trial");
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpgrade = async (plan: string) => {
    setActionLoading(plan);
    setError(null);
    try {
      const sub = await subscriptionApi.upgrade(plan);
      setSubscription(sub);
      setSuccess(`Plan changed to ${plan}`);
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to change plan");
    } finally {
      setActionLoading(null);
    }
  };

  const trialActive = subscription?.status === "trial";
  const trialEndsAt = subscription?.trialEndsAt ? new Date(subscription.trialEndsAt) : null;
  const trialExpired = trialEndsAt ? new Date() > trialEndsAt : false;
  const trialDaysLeft = trialEndsAt ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / 86400000)) : 0;
  const trialHoursLeft = trialEndsAt ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / 3600000)) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Subscription</h2>
        <p className="text-slate-400 text-sm mt-1">Manage your plan and billing</p>
      </div>

      {error && (
        <div className="text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-lg px-4 py-3">{error}</div>
      )}
      {success && (
        <div className="text-sm text-emerald-400 bg-emerald-900/20 border border-emerald-800 rounded-lg px-4 py-3">{success}</div>
      )}

      {/* Current plan banner */}
      {subscription && (
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <Crown className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-white">{subscription.plan} Plan</span>
                {trialActive && !trialExpired && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Clock className="h-3 w-3 inline mr-1 -mt-0.5" />
                    {trialDaysLeft > 0 ? `${trialDaysLeft}d left` : `${trialHoursLeft}h left`}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-400 mt-0.5">
                {isUnlimited(subscription.limits.maxWorkflows) ? "Unlimited workflows" : `${subscription.limits.maxWorkflows} workflow`}
                {" · "}
                {isUnlimited(subscription.limits.maxRuns) ? "Unlimited runs" : `${subscription.limits.maxRuns} runs`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Usage section */}
      {subscription && (
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6">
          <h4 className="text-sm font-semibold text-white mb-4">Current Usage</h4>
          <div className="grid grid-cols-2 gap-4">
            <UsageBar
              used={usage.workflows}
              max={subscription.limits.maxWorkflows}
              label="Workflows"
              icon={LayoutDashboard}
            />
            <UsageBar
              used={usage.runs}
              max={subscription.limits.maxRuns}
              label="Runs"
              icon={Play}
            />
          </div>
          {trialActive && !trialExpired && trialEndsAt && (
            <div className="mt-4 bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 flex items-center gap-3">
              <Clock className="h-5 w-5 text-amber-400 flex-shrink-0" />
              <div>
                <p className="text-sm text-amber-300 font-medium">
                  Trial ends {trialDaysLeft > 0 ? `in ${trialDaysLeft} day${trialDaysLeft > 1 ? "s" : ""}` : `in ${trialHoursLeft} hour${trialHoursLeft > 1 ? "s" : ""}`}
                </p>
                <p className="text-xs text-amber-400/70 mt-0.5">
                  {trialEndsAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {PLANS.map((plan) => {
          const isCurrent = subscription?.plan === plan.id;
          const PlanIcon = plan.icon;

          return (
            <div
              key={plan.id}
              className={`relative bg-slate-800/60 border rounded-xl p-6 transition-all ${isCurrent ? "border-purple-500/50 ring-1 ring-purple-500/20" : "border-slate-700 hover:border-slate-600"
                }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-600 text-white shadow-lg">Popular</span>
                </div>
              )}
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${plan.color} flex items-center justify-center`}>
                  <PlanIcon className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
              </div>
              <div className="mb-6">
                <span className="text-3xl font-bold text-white">{plan.price}</span>
                <span className="text-slate-400 text-sm ml-1">{plan.period}</span>
              </div>
              <ul className="space-y-2.5 mb-6">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    {f.included ? <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" /> : <X className="h-4 w-4 text-slate-600 flex-shrink-0" />}
                    <span className={f.included ? "text-slate-300" : "text-slate-600"}>{f.text}</span>
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <button disabled className="w-full py-2.5 text-sm rounded-lg bg-slate-700 text-slate-400 font-medium cursor-default">
                  Current Plan
                </button>
              ) : plan.id === "PRO" && subscription?.plan === "FREE" ? (
                <div className="space-y-2">
                  <button
                    onClick={handleActivateTrial}
                    disabled={actionLoading === "trial"}
                    className="w-full py-2.5 text-sm rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium transition-all shadow-lg hover:shadow-purple-500/25 disabled:opacity-60"
                  >
                    {actionLoading === "trial" ? "Activating..." : "Start 3-Day Free Trial"}
                  </button>
                  <button
                    onClick={() => handleUpgrade("PRO")}
                    disabled={actionLoading === "PRO"}
                    className="w-full py-2.5 text-sm rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium transition-all disabled:opacity-60"
                  >
                    {actionLoading === "PRO" ? "Upgrading..." : "Upgrade to PRO"}
                  </button>
                </div>
              ) : plan.id === "FREE" && subscription?.plan === "PRO" && trialActive && !trialExpired ? (
                <button disabled className="w-full py-2.5 text-sm rounded-lg bg-slate-700 text-slate-500 font-medium cursor-not-allowed">
                  Auto-reverts after trial ({trialDaysLeft > 0 ? `${trialDaysLeft}d` : `${trialHoursLeft}h`} left)
                </button>
              ) : (
                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={!!actionLoading}
                  className="w-full py-2.5 text-sm rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium transition-all disabled:opacity-60"
                >
                  {actionLoading === plan.id ? "Switching..." : `Switch to ${plan.name}`}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
