import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layout } from "./components/Layout";
import { WorkflowsPage } from "./pages/WorkflowsPage";
import { RunsPage } from "./pages/RunsPage";
import { RunDetailsPage } from "./pages/RunDetailsPage";
import { StatsPage } from "./pages/StatsPage";
import { LandingPage } from "./pages/LandingPage";
import { ProfilePage } from "./pages/ProfilePage";

type Page = "workflows" | "runs" | "stats" | "profile";

const App: React.FC = () => {
  const [page, setPage] = useState<Page>("workflows");
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [showLanding, setShowLanding] = useState(true);
  const [isDark, setIsDark] = useState(false);

  if (showLanding) {
    return (
      <div className="min-h-screen bg-gradient-dark text-white">
        <LandingPage
          onGetStarted={() => setShowLanding(false)}
          onViewDocs={() => window.open("http://localhost:4000/docs", "_blank")}
        />
      </div>
    );
  }

  const renderContent = () => {
    if (page === "workflows") {
      return <WorkflowsPage />;
    }
    if (page === "runs") {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RunsPage onSelectRun={setSelectedRunId} />
          <RunDetailsPage runId={selectedRunId} />
        </div>
      );
    }
    if (page === "stats") {
      return <StatsPage />;
    }
    if (page === "profile") {
      return <ProfilePage />;
    }
    return null;
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={showLanding ? "landing" : "app"}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className={`min-h-screen ${isDark ? 'dark' : ''}`}
      >
        <Layout
          currentPage={page}
          onChangePage={(p) => setPage(p as any)}
          isDark={isDark}
          onToggleDark={() => setIsDark(!isDark)}
        >
          {renderContent()}
        </Layout>
      </motion.div>
    </AnimatePresence>
  );
};

export default App;

