import React, { useEffect } from "react";
import { useThemeStore } from "../store/useThemeStore";

type LayoutProps = {
  currentPage: string;
  onChangePage: (page: string) => void;
  children: React.ReactNode;
};

const navItems = [
  { id: "workflows", label: "Workflows" },
  { id: "runs", label: "Runs" },
  { id: "stats", label: "Statistics" },
];

export const Layout: React.FC<LayoutProps> = ({
  currentPage,
  onChangePage,
  children,
}) => {
  const { theme, toggleTheme } = useThemeStore();

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-50">
      <aside className="w-64 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <h1 className="text-xl font-semibold text-primary-600 dark:text-primary-400">
            Mini Zapier
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Workflow automation dashboard
          </p>
        </div>
        <nav className="p-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition ${
                currentPage === item.id
                  ? "bg-primary-600 text-white"
                  : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
              onClick={() => onChangePage(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>
      <main className="flex-1 flex flex-col">
        <header className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold capitalize">
              {currentPage}
            </h2>
          </div>
          <button
            onClick={toggleTheme}
            className="px-3 py-1.5 text-xs rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
        </header>
        <section className="flex-1 p-6 overflow-y-auto bg-slate-100 dark:bg-slate-950">
          {children}
        </section>
      </main>
    </div>
  );
};

