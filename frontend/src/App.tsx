import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { Layout } from "./components/Layout";
import { WorkflowsPage } from "./pages/WorkflowsPage";
import { WorkflowDetailPage } from "./pages/WorkflowDetailPage";
import { RunsPage } from "./pages/RunsPage";
import { RunDetailsPage } from "./pages/RunDetailsPage";
import { StatsPage } from "./pages/StatsPage";
import { LandingPage } from "./pages/LandingPage";
import { ProfilePage } from "./pages/ProfilePage";
import { useAuthStore } from "./store/useAuthStore";

const ProtectedRoutes: React.FC = () => {
  const { token, logout, fetchUser } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  const pathSegments = location.pathname.split("/").filter(Boolean);
  const currentPage = pathSegments[0] || "workflows";

  useEffect(() => {
    if (!token) {
      navigate("/", { replace: true });
      return;
    }
    fetchUser();
  }, [token, navigate, fetchUser]);

  if (!token) return null;

  const handleChangePage = (page: string) => {
    navigate(`/${page}`);
  };

  const handleLogoClick = () => {
    navigate("/workflows");
  };

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <Layout
      currentPage={currentPage}
      onChangePage={handleChangePage}
      onBackToLanding={handleLogoClick}
      onLogout={handleLogout}
    >
      <Routes>
        <Route path="/workflows" element={<WorkflowsPage />} />
        <Route path="/workflows/:id" element={<WorkflowDetailPage />} />
        <Route
          path="/runs"
          element={
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RunsPage onSelectRun={setSelectedRunId} />
              <RunDetailsPage runId={selectedRunId} />
            </div>
          }
        />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/workflows" replace />} />
      </Routes>
    </Layout>
  );
};

const OAuthTokenHandler: React.FC = () => {
  const { setToken, fetchUser } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");
    if (urlToken) {
      setToken(urlToken);
      fetchUser();
      navigate("/workflows", { replace: true });
    }
  }, [setToken, fetchUser, navigate]);

  return null;
};

const App: React.FC = () => {
  const token = useAuthStore((s) => s.token);

  return (
    <Router>
      <OAuthTokenHandler />
      <Routes>
        <Route
          path="/"
          element={
            token ? (
              <Navigate to="/workflows" replace />
            ) : (
              <div className="min-h-screen bg-gradient-dark text-white">
                <LandingPage />
              </div>
            )
          }
        />
        <Route path="/*" element={<ProtectedRoutes />} />
      </Routes>
    </Router>
  );
};

export default App;
