import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Layout } from "./components/Layout";
import { WorkflowsPage } from "./pages/WorkflowsPage";
import { WorkflowsSimplePage } from "./pages/WorkflowsSimplePage";
import { RunsPage } from "./pages/RunsPage";
import { RunDetailsPage } from "./pages/RunDetailsPage";
import { StatsPage } from "./pages/StatsPage";
import { LandingPage } from "./pages/LandingPage";
import { ProfilePage } from "./pages/ProfilePage";

type Page = "workflows" | "runs" | "stats" | "profile";

const App: React.FC = () => {
  const [page, setPage] = useState<Page>("workflows");
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const renderContent = () => {
    if (page === "workflows") {
      return isLoggedIn ? <WorkflowsSimplePage /> : <WorkflowsPage />;
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
    <Router>
      <Routes>
        {/* Landing page route */}
        <Route
          path="/"
          element={
            <div className="min-h-screen bg-gradient-dark text-white">
              <LandingPage
                onGetStarted={() => {
                  setIsLoggedIn(true);
                }}
                onViewDocs={() => window.open("http://localhost:4000/docs", "_blank")}
                onAuthSuccess={() => {
                  setIsLoggedIn(true);
                }}
              />
            </div>
          }
        />

        {/* Authenticated routes */}
        <Route
          path="/*"
          element={
            <AnimatePresence mode="wait">
              <motion.div
                key="app"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className={`min-h-screen ${isDark ? 'dark' : ''}`}
              >
                <Layout
                  currentPage={page}
                  onChangePage={(p) => setPage(p as any)}
                  onBackToLanding={() => setIsLoggedIn(false)}
                >
                  <Routes>
                    <Route path="/workflow" element={renderContent()} />
                    <Route path="/workflows" element={renderContent()} />
                    <Route path="/runs" element={renderContent()} />
                    <Route path="/stats" element={renderContent()} />
                    <Route path="/profile" element={renderContent()} />
                    <Route path="*" element={<Navigate to="/workflow" replace />} />
                  </Routes>
                </Layout>
              </motion.div>
            </AnimatePresence>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;

