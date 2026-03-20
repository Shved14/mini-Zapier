import React from "react";
import { Zap, LayoutDashboard, Play, BarChart3, LogOut, Sun, Moon } from "lucide-react";
import { NotificationBell } from "./NotificationBell";
import { useThemeStore } from "../store/useThemeStore";

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
];

export const Layout: React.FC<LayoutProps> = ({
  currentPage,
  onChangePage,
  children,
  onBackToLanding,
  onLogout,
}) => {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <div className="min-h-screen flex theme-bg theme-text theme-transition">
      {/* Sidebar */}
      <aside className="w-64 border-r theme-border theme-sidebar flex flex-col shrink-0 theme-transition">
        <div className="p-4 border-b theme-border">
          <button
            onClick={onBackToLanding}
            className="flex items-center gap-2 group"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg group-hover:shadow-purple-500/25 transition-shadow">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="text-base font-bold theme-text group-hover:text-purple-400 transition-colors">
                Mini Zapier
              </span>
              <p className="text-[10px] theme-text-muted leading-none">
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
                  ? "bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/30 shadow-sm"
                  : "theme-text-secondary hover:theme-text hover:bg-black/5 dark:hover:bg-white/5 border border-transparent"
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
        <header className="px-6 py-3 border-b theme-border flex items-center justify-between theme-bg-secondary theme-transition shrink-0">
          <h2 className="text-base font-semibold capitalize theme-text">
            {currentPage.replace("workflows/", "Workflow / ")}
          </h2>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium theme-text-secondary hover:theme-text border theme-border hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-200"
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? (
                <><Sun className="h-3.5 w-3.5" /> Light</>
              ) : (
                <><Moon className="h-3.5 w-3.5" /> Dark</>
              )}
            </button>
          </div>
        </header>
        <section className="flex-1 p-6 overflow-y-auto">
          {children}
        </section>
      </main>
    </div>
  );
};

