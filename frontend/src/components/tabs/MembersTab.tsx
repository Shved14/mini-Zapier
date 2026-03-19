import React, { useEffect, useState } from "react";
import { Users, UserPlus, Trash2, Crown, Shield, Eye, Copy, Check, LogOut, Mail, Clock } from "lucide-react";
import { membersApi, WorkflowMember, WorkflowInvite } from "../../api/members";
import { useAuthStore } from "../../store/useAuthStore";

type MembersTabProps = {
  workflowId: string;
  ownerId: string;
};

const roleIcons: Record<string, React.ReactNode> = {
  owner: <Crown className="h-3.5 w-3.5 text-amber-400" />,
  editor: <Shield className="h-3.5 w-3.5 text-blue-400" />,
  viewer: <Eye className="h-3.5 w-3.5 text-gray-400" />,
};

const roleBadgeClass: Record<string, string> = {
  owner: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  editor: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  viewer: "bg-gray-500/20 text-gray-300 border-gray-500/30",
};

export const MembersTab: React.FC<MembersTabProps> = ({ workflowId, ownerId }) => {
  const { user } = useAuthStore();
  const [members, setMembers] = useState<WorkflowMember[]>([]);
  const [invites, setInvites] = useState<WorkflowInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("viewer");
  const [inviteError, setInviteError] = useState("");
  const [inviting, setInviting] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);

  const isOwner = user?.id === ownerId;

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const data = await membersApi.list(workflowId);
      setMembers(data.members ?? []);
      setInvites(data.invites ?? []);
    } catch {
      setMembers([]);
      setInvites([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [workflowId]);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) { setInviteError("Email is required"); return; }
    setInviting(true);
    setInviteError("");
    try {
      await membersApi.inviteByEmail(workflowId, inviteEmail.trim(), inviteRole);
      setInviteEmail("");
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

  const handleLeave = async () => {
    setLeaving(true);
    try {
      await membersApi.leave(workflowId);
      window.location.href = "/workflows";
    } catch {
      setLeaving(false);
    }
  };

  const copyInviteLink = (token: string) => {
    const link = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const getMemberDisplay = (m: WorkflowMember) => {
    if (m.user?.name) return m.user.name;
    if (m.user?.email) return m.user.email;
    return m.userId.slice(0, 12) + "...";
  };

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Users className="h-5 w-5 text-purple-400" />
          Members
        </h3>
        <div className="flex items-center gap-2">
          {!isOwner && user && (
            <button
              onClick={handleLeave}
              disabled={leaving}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 transition-all disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" /> {leaving ? "Leaving..." : "Leave"}
            </button>
          )}
          {isOwner && (
            <button
              onClick={() => setShowInvite(!showInvite)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 transition-all"
            >
              <UserPlus className="h-4 w-4" /> Invite
            </button>
          )}
        </div>
      </div>

      {/* Invite form — now email-based */}
      {showInvite && (
        <div className="mb-6 p-4 rounded-xl border border-white/10 bg-white/5 space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Email address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="user@example.com"
                type="email"
                className="w-full pl-10 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Role</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
            >
              <option value="viewer">Viewer (read-only)</option>
              <option value="editor">Editor (can edit nodes)</option>
            </select>
          </div>
          {inviteError && <p className="text-xs text-red-400">{inviteError}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleInvite}
              disabled={inviting}
              className="px-4 py-2 text-sm rounded-lg bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 transition-all"
            >
              {inviting ? "Sending..." : "Send invite"}
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

      {loading && <div className="text-sm text-gray-400 animate-pulse mt-4">Loading members...</div>}

      {/* Members list */}
      <div className="space-y-1">
        {members.map((m) => {
          const isMe = m.userId === user?.id;
          return (
            <div key={m.id} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors group">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${m.role === "owner" ? "bg-gradient-to-br from-amber-500 to-orange-400" :
                  m.role === "editor" ? "bg-gradient-to-br from-blue-500 to-cyan-400" :
                    "bg-gradient-to-br from-gray-500 to-gray-400"
                }`}>
                {(m.user?.name?.[0] || m.user?.email?.[0] || m.role[0]).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white font-medium truncate">
                  {getMemberDisplay(m)} {isMe && <span className="text-xs text-gray-500">(you)</span>}
                </div>
                <div className="text-xs text-gray-500">
                  {m.user?.email && m.user.name ? m.user.email : `Joined ${new Date(m.createdAt).toLocaleDateString()}`}
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs border flex items-center gap-1 ${roleBadgeClass[m.role] || roleBadgeClass.viewer}`}>
                {roleIcons[m.role]} {m.role}
              </span>
              {isOwner && !isMe && (
                <button
                  onClick={() => handleRemove(m.userId)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-all"
                  title="Remove member"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Pending invites */}
      {invites.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-1.5">
            <Clock className="h-4 w-4" /> Pending Invites
          </h4>
          <div className="space-y-1">
            {invites.map((inv) => (
              <div key={inv.id} className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/[0.02] border border-white/5 group">
                <div className="w-8 h-8 rounded-full bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center">
                  <Mail className="h-4 w-4 text-yellow-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white font-medium truncate">{inv.email}</div>
                  <div className="text-xs text-gray-500">Invited as {inv.role}</div>
                </div>
                <button
                  onClick={() => copyInviteLink(inv.token)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 transition-all"
                  title="Copy invite link"
                >
                  {copiedToken === inv.token ? (
                    <><Check className="h-3 w-3 text-emerald-400" /> Copied</>
                  ) : (
                    <><Copy className="h-3 w-3" /> Copy link</>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && members.length === 0 && invites.length === 0 && (
        <div className="text-center py-8 text-gray-500 text-sm">
          No members yet. {isOwner ? "Invite someone to collaborate!" : ""}
        </div>
      )}
    </div>
  );
};
