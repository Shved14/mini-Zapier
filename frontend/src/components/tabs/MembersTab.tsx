import React, { useEffect, useState } from "react";
import { Users, UserPlus, Trash2, Crown, Shield, Eye } from "lucide-react";
import { membersApi, WorkflowMember } from "../../api/members";
import { useAuthStore } from "../../store/useAuthStore";

type MembersTabProps = {
  workflowId: string;
  ownerId: string;
};

const roleIcons: Record<string, React.ReactNode> = {
  owner: <Crown className="h-4 w-4 text-amber-400" />,
  editor: <Shield className="h-4 w-4 text-blue-400" />,
  viewer: <Eye className="h-4 w-4 text-gray-400" />,
};

const roleBadgeClass: Record<string, string> = {
  owner: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  editor: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  viewer: "bg-gray-500/20 text-gray-300 border-gray-500/30",
};

export const MembersTab: React.FC<MembersTabProps> = ({ workflowId, ownerId }) => {
  const { user } = useAuthStore();
  const [members, setMembers] = useState<WorkflowMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteUserId, setInviteUserId] = useState("");
  const [inviteRole, setInviteRole] = useState("viewer");
  const [inviteError, setInviteError] = useState("");
  const [inviting, setInviting] = useState(false);

  const isOwner = user?.id === ownerId;

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const data = await membersApi.list(workflowId);
      setMembers(data.members);
    } catch {
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [workflowId]);

  const handleInvite = async () => {
    if (!inviteUserId.trim()) { setInviteError("User ID is required"); return; }
    setInviting(true);
    setInviteError("");
    try {
      await membersApi.invite(workflowId, inviteUserId.trim(), inviteRole);
      setInviteUserId("");
      setShowInvite(false);
      fetchMembers();
    } catch (err: any) {
      setInviteError(err.response?.data?.message || "Failed to invite");
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (userId: string) => {
    try {
      await membersApi.remove(workflowId, userId);
      fetchMembers();
    } catch { /* silently fail */ }
  };

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Users className="h-5 w-5 text-purple-400" />
          Members
        </h3>
        {isOwner && (
          <button
            onClick={() => setShowInvite(!showInvite)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 transition-all"
          >
            <UserPlus className="h-4 w-4" /> Invite
          </button>
        )}
      </div>

      {/* Invite form */}
      {showInvite && (
        <div className="mb-6 p-4 rounded-xl border border-white/10 bg-white/5 space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">User ID</label>
            <input
              value={inviteUserId}
              onChange={(e) => setInviteUserId(e.target.value)}
              placeholder="Paste user ID..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Role</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
            >
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
            </select>
          </div>
          {inviteError && <p className="text-xs text-red-400">{inviteError}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleInvite}
              disabled={inviting}
              className="px-4 py-2 text-sm rounded-lg bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 transition-all"
            >
              {inviting ? "Inviting..." : "Send invite"}
            </button>
            <button
              onClick={() => { setShowInvite(false); setInviteError(""); }}
              className="px-4 py-2 text-sm rounded-lg border border-white/10 hover:bg-white/5 text-gray-400 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Owner row */}
      <div className="mb-2">
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-400 flex items-center justify-center text-xs font-bold text-white">
            O
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm text-white font-medium truncate">{ownerId.slice(0, 12)}...</div>
            <div className="text-xs text-gray-500">Owner</div>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-xs border flex items-center gap-1 ${roleBadgeClass.owner}`}>
            {roleIcons.owner} Owner
          </span>
        </div>
      </div>

      {loading && <div className="text-sm text-gray-400 animate-pulse mt-4">Loading members...</div>}

      {/* Members list */}
      <div className="space-y-1">
        {members.map((m) => (
          <div key={m.id} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors group">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-400 flex items-center justify-center text-xs font-bold text-white">
              {m.role === "editor" ? "E" : "V"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-white font-medium truncate">{m.userId.slice(0, 12)}...</div>
              <div className="text-xs text-gray-500">
                {m.status === "pending" ? "Invite pending" : `Joined ${new Date(m.createdAt).toLocaleDateString()}`}
              </div>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-xs border flex items-center gap-1 ${roleBadgeClass[m.role] || roleBadgeClass.viewer}`}>
              {roleIcons[m.role]} {m.role}
            </span>
            {m.status === "pending" && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                pending
              </span>
            )}
            {isOwner && (
              <button
                onClick={() => handleRemove(m.userId)}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-all"
                title="Remove member"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {!loading && members.length === 0 && (
        <div className="text-center py-8 text-gray-500 text-sm">
          No members yet. {isOwner ? "Invite someone to collaborate!" : ""}
        </div>
      )}
    </div>
  );
};
