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
import { InviteAcceptPage } from "./pages/InviteAcceptPage";
import { useAuthStore } from "./store/useAuthStore";

// Loading spinner component
const LoadingSpinner: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
  </div>
);

const ProtectedRoutes: React.FC = () => {
  const { token, user, loading, initialized, fetchUser } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [fetchAttempted, setFetchAttempted] = useState(false);

  const pathSegments = location.pathname.split("/").filter(Boolean);
  const currentPage = pathSegments[0] || "workflows";

  useEffect(() => {
    console.log("[ProtectedRoutes] Auth state:", { token: !!token, user: !!user, loading, initialized, fetchAttempted });

    if (!initialized) return;

    if (!token) {
      console.log("[ProtectedRoutes] No token → landing");
      navigate("/", { replace: true });
      return;
    }

    // Fetch user once if we have a token but no user yet
    if (token && !user && !loading && !fetchAttempted) {
      console.log("[ProtectedRoutes] Fetching user data");
      setFetchAttempted(true);
      fetchUser();
    }
  }, [token, user, loading, initialized, navigate, fetchUser, fetchAttempted]);

  // Show loading while initializing or fetching user
  if (!initialized || loading) {
    console.log("[ProtectedRoutes] Showing loading spinner");
    return <LoadingSpinner />;
  }

  // Redirect if no token after initialization
  if (!token) {
    console.log("[ProtectedRoutes] No token after initialization, returning null");
    return null;
  }

  console.log("[ProtectedRoutes] Rendering protected content");

  const handleChangePage = (page: string) => {
    navigate(`/${page}`);
  };

  const handleLogoClick = () => {
    navigate("/workflows");
  };

  const handleLogout = () => {
    const { logout } = useAuthStore.getState();
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
      console.log("[OAuthTokenHandler] Found token in URL");
      const handleOAuthToken = async () => {
        try {
          setToken(urlToken);
          await fetchUser();
          navigate("/workflows", { replace: true });
        } catch (error) {
          console.error("[OAuthTokenHandler] OAuth token validation failed:", error);
          navigate("/", { replace: true });
        }
      };

      handleOAuthToken();
    }
  }, [setToken, fetchUser, navigate]);

  return null;
};

const App: React.FC = () => {
  const { token, user, initialized, initialize } = useAuthStore();

  useEffect(() => {
    console.log("[App] Initializing app");
    initialize();
  }, [initialize]);

  console.log("[App] App state:", { token: !!token, user: !!user, initialized });

  // Show loading while app is initializing
  if (!initialized) {
    return <LoadingSpinner />;
  }

  return (
    <Router>
      <OAuthTokenHandler />
      <Routes>
        <Route
          path="/"
          element={
            token && user ? (
              <Navigate to="/workflows" replace />
            ) : (
              <div className="min-h-screen bg-gradient-dark text-white">
                <LandingPage />
              </div>
            )
          }
        />
        <Route path="/invite/:token" element={<InviteAcceptPage />} />
        <Route path="/*" element={<ProtectedRoutes />} />
      </Routes>
    </Router>
  );
};

export default App;
