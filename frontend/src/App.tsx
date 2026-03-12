import React, { useState } from "react";
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

  if (showLanding) {
    return (
      <LandingPage
        onGetStarted={() => setShowLanding(false)}
        onViewDocs={() => window.open("http://localhost:4000/docs", "_blank")}
      />
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
    <Layout currentPage={page} onChangePage={(p) => setPage(p as any)}>
      {renderContent()}
    </Layout>
  );
};

export default App;

