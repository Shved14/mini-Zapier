import React, { useEffect, useState } from "react";
import { Zap, LayoutDashboard, Play, BarChart3, User, Crown, LogOut, Clock } from "lucide-react";
import { NotificationBell } from "./NotificationBell";
import { subscriptionApi, Subscription } from "../api/subscription";

type LayoutProps = {
  currentPage: string;
  onChangePage: (page: string) => void;
  children: React.ReactNode;
  onBackToLanding?: () => void;
  onLogout?: () => void;
};

const navItems = [
  { id: "workflows", label: "Workflows", icon: LayoutDashboard },
  { id: "runs", label: "Runs", icon: Play },
  { id: "stats", label: "Statistics", icon: BarChart3 },
  { id: "subscriptions", label: "Subscription", icon: Crown },
  { id: "profile", label: "Profile", icon: User },
];

export const Layout: React.FC<LayoutProps> = ({
  currentPage,
  onChangePage,
  children,
  onBackToLanding,
  onLogout,
}) => {
  const [sub, setSub] = useState<Subscription | null>(null);

  useEffect(() => {
    subscriptionApi.get().then(setSub).catch(() => { });
  }, []);

  const trialActive = sub?.status === "trial" && sub?.plan === "PRO";
  const trialEndsAt = sub?.trialEndsAt ? new Date(sub.trialEndsAt) : null;
  const trialExpired = trialEndsAt ? new Date() > trialEndsAt : false;
  const trialDaysLeft = trialEndsAt ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / 86400000)) : 0;
  const trialHoursLeft = trialEndsAt ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / 3600000)) : 0;
  const showTrialBanner = trialActive && !trialExpired;

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-50">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 bg-slate-900/80 flex flex-col shrink-0">
        <div className="p-4 border-b border-white/10">
          <button
            onClick={onBackToLanding}
            className="flex items-center gap-2 group"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg group-hover:shadow-purple-500/25 transition-shadow">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="text-base font-bold text-white group-hover:text-purple-300 transition-colors">
                Mini Zapier
              </span>
              <p className="text-[10px] text-gray-500 leading-none">
                Automation platform
              </p>
            </div>
          </button>
        </div>
        <nav className="p-3 space-y-1 flex flex-col flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id || currentPage.startsWith(item.id);
            return (
              <button
                key={item.id}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-sm"
                  : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
                onClick={() => onChangePage(item.id)}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
          <div className="flex-1" />
          {onLogout && (
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400/70 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 border border-transparent"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          )}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="px-6 py-3 border-b border-white/10 flex items-center justify-between bg-slate-900/40 shrink-0">
          <h2 className="text-base font-semibold capitalize text-white">
            {currentPage.replace("workflows/", "Workflow / ")}
          </h2>
          <div className="flex items-center gap-2">
            <NotificationBell />
          </div>
        </header>
        {showTrialBanner && (
          <div className="px-6 py-2.5 bg-gradient-to-r from-amber-500/10 to-purple-500/10 border-b border-amber-500/20 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-amber-400" />
              <span className="text-amber-300">
                PRO trial ends in{" "}
                <strong>{trialDaysLeft > 0 ? `${trialDaysLeft} day${trialDaysLeft > 1 ? "s" : ""}` : `${trialHoursLeft} hour${trialHoursLeft > 1 ? "s" : ""}`}</strong>
              </span>
            </div>
            <button
              onClick={() => onChangePage("subscriptions")}
              className="text-xs px-3 py-1 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors"
            >
              Upgrade
            </button>
          </div>
        )}
        <section className="flex-1 p-6 overflow-y-auto">
          {children}
        </section>
      </main>
    </div>
  );
};

