import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, X, Mail, Users, Zap, AlertCircle } from "lucide-react";
import { workflowsApi } from "../api/workflows";

export const InvitePage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<any>(null);
  const [action, setAction] = useState<"accept" | "decline" | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (!token) {
      setError("Invalid invitation link");
      setLoading(false);
      return;
    }

    fetchInvitation();
  }, [token]);

  const fetchInvitation = async () => {
    try {
      const response = await fetch(`/api/workflows/invite/${token}`);
      if (!response.ok) {
        throw new Error("Invitation not found or expired");
      }
      const data = await response.json();
      setInvitation(data.invitation);
    } catch (err: any) {
      setError(err.message || "Failed to load invitation");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (actionType: "accept" | "decline") => {
    if (!token || !user) return;

    setAction(actionType);
    try {
      const response = await fetch(`/api/workflows/invite/${token}/${actionType}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to ${actionType} invitation`);
      }

      const data = await response.json();
      
      if (actionType === "accept") {
        // Redirect to workflow
        navigate(`/workflows/${invitation.workflow.id}`);
      } else {
        // Redirect to workflows list
        navigate("/workflows");
      }
    } catch (err: any) {
      setError(err.message || `Failed to ${actionType} invitation`);
      setAction(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white animate-pulse">Loading invitation...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto p-6 text-center"
        >
          <div className="w-16 h-16 bg-red-500/20 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Invitation Error</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <Link
            to="/workflows"
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            Back to Workflows
          </Link>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto p-6"
        >
          <div className="w-16 h-16 bg-purple-500/20 border border-purple-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-purple-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">You're Invited!</h1>
          <p className="text-gray-400 mb-6">
            You've been invited to join the workflow <strong>"{invitation.workflow.name}"</strong>
          </p>
          <div className="bg-slate-900 border border-white/10 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-400 mb-2">Please sign in to accept or decline this invitation:</p>
            <Link
              to={`/login?redirect=/invite/${token}`}
              className="w-full block text-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              Sign In
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto p-6"
      >
        <div className="w-16 h-16 bg-purple-500/20 border border-purple-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-purple-400" />
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-2">You're Invited!</h1>
        
        <div className="bg-slate-900 border border-white/10 rounded-lg p-4 mb-6">
          <p className="text-gray-300 mb-2">
            You've been invited to join the workflow:
          </p>
          <div className="flex items-center gap-2 text-purple-300">
            <Zap className="w-4 h-4" />
            <span className="font-semibold">{invitation.workflow.name}</span>
          </div>
          <p className="text-sm text-gray-400 mt-2">
            Role: <span className="text-purple-400">{invitation.role}</span>
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleAction("accept")}
            disabled={action !== null}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            {action === "accept" ? "Accepting..." : "Accept"}
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleAction("decline")}
            disabled={action !== null}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
            {action === "decline" ? "Declining..." : "Decline"}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};
