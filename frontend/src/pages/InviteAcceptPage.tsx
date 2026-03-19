import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { membersApi } from "../api/members";
import { useAuthStore } from "../store/useAuthStore";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export const InviteAcceptPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { token: authToken } = useAuthStore();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid invite link");
      return;
    }

    if (!authToken) {
      setStatus("error");
      setMessage("Please sign in first to accept this invitation");
      return;
    }

    membersApi
      .acceptInviteByToken(token)
      .then(() => {
        setStatus("success");
        setMessage("You've joined the workflow!");
        setTimeout(() => navigate("/workflows"), 2000);
      })
      .catch((err: any) => {
        setStatus("error");
        setMessage(err.response?.data?.message || "Failed to accept invite");
      });
  }, [token, authToken, navigate]);

  return (
    <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
      <div className="text-center p-8 rounded-2xl border border-white/10 bg-white/[0.02] max-w-sm mx-4">
        {status === "loading" && (
          <>
            <Loader2 className="h-10 w-10 text-purple-400 animate-spin mx-auto mb-4" />
            <p className="text-white font-medium">Accepting invitation...</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle className="h-10 w-10 text-emerald-400 mx-auto mb-4" />
            <p className="text-white font-medium">{message}</p>
            <p className="text-gray-500 text-sm mt-2">Redirecting to workflows...</p>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle className="h-10 w-10 text-red-400 mx-auto mb-4" />
            <p className="text-white font-medium">{message}</p>
            {!authToken ? (
              <button
                onClick={() => navigate("/")}
                className="mt-4 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm transition-all"
              >
                Go to sign in
              </button>
            ) : (
              <button
                onClick={() => navigate("/workflows")}
                className="mt-4 px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 text-white text-sm transition-all"
              >
                Go to workflows
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
