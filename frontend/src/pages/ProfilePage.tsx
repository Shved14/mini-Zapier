import React, { useEffect, useState, useRef } from "react";
import { Camera, Save, User, Mail, Calendar, Crown, Shield } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { userApi } from "../api/user";

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  free: { label: "Free", color: "text-gray-400 bg-gray-500/10 border-gray-500/20" },
  pro: { label: "Pro", color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
  business: { label: "Business", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
};

export const ProfilePage: React.FC = () => {
  const { user, fetchUser } = useAuthStore();
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();
  const [name, setName] = useState(user?.name ?? "");
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    setError(undefined);
    setSuccess(undefined);
    try {
      await userApi.updateMe({ name });
      await fetchUser();
      setSuccess("Profile updated successfully");
      setTimeout(() => setSuccess(undefined), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 512 * 1024) {
      setError("Avatar must be less than 512 KB");
      return;
    }

    setAvatarUploading(true);
    setError(undefined);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        await userApi.updateMe({ avatarUrl: dataUrl });
        await fetchUser();
        setAvatarUploading(false);
        setSuccess("Avatar updated");
        setTimeout(() => setSuccess(undefined), 3000);
      };
      reader.onerror = () => {
        setError("Failed to read file");
        setAvatarUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setError("Failed to upload avatar");
      setAvatarUploading(false);
    }
  };

  const avatarLetter =
    user?.name?.[0]?.toUpperCase() ??
    user?.email?.[0]?.toUpperCase() ??
    "?";

  const plan = PLAN_LABELS[user?.plan ?? "free"] ?? PLAN_LABELS.free;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric",
    });
  };

  if (!user) {
    return (
      <div className="text-center py-12 bg-slate-800/60 border border-slate-700 rounded-lg">
        <div className="text-slate-400 mb-2">Profile data not loaded</div>
        <div className="text-sm text-slate-500">Try refreshing the page or logging in again</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Profile</h2>
        <p className="text-slate-400 text-sm mt-1">Manage your account and personal information</p>
      </div>

      {error && (
        <div className="text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-lg px-4 py-3">{error}</div>
      )}
      {success && (
        <div className="text-sm text-emerald-400 bg-emerald-900/20 border border-emerald-800 rounded-lg px-4 py-3">{success}</div>
      )}

      {/* Avatar + Header Card */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6">
        <div className="flex items-center gap-6">
          <div className="relative group">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt="Avatar"
                className="w-24 h-24 rounded-full object-cover border-2 border-purple-500/30 shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-emerald-400 flex items-center justify-center text-3xl font-bold text-white shadow-lg border-2 border-purple-500/30">
                {avatarLetter}
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarUploading}
              className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
            >
              <Camera className="h-6 w-6 text-white" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={handleAvatarChange}
            />
            {avatarUploading && (
              <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            )}
          </div>

          <div className="flex-1">
            <h3 className="text-xl font-semibold text-white">{user.name || "Unnamed User"}</h3>
            <p className="text-sm text-slate-400 mt-0.5">{user.email}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${plan.color}`}>
                <Crown className="h-3 w-3 inline mr-1 -mt-0.5" />{plan.label}
              </span>
              <span className="text-xs text-slate-500">
                <Shield className="h-3 w-3 inline mr-1 -mt-0.5" />
                {user.provider === "local" ? "Email" : user.provider ?? "Email"} auth
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <User className="h-4 w-4 text-purple-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-slate-500 uppercase tracking-wider">User ID</p>
            <p className="text-sm text-white font-mono truncate">{user.id}</p>
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Mail className="h-4 w-4 text-blue-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-slate-500 uppercase tracking-wider">Email</p>
            <p className="text-sm text-white truncate">{user.email}</p>
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Crown className="h-4 w-4 text-amber-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-slate-500 uppercase tracking-wider">Subscription</p>
            <p className="text-sm text-white capitalize">{user.plan ?? "Free"} Plan</p>
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Calendar className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-slate-500 uppercase tracking-wider">Member Since</p>
            <p className="text-sm text-white">{formatDate(user.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* Edit Name */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6">
        <h4 className="text-sm font-semibold text-white mb-4">Edit Profile</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
              Display Name
            </label>
            <input
              className="w-full text-sm bg-slate-900/60 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-slate-500">Click the avatar to upload a new photo (max 512 KB)</p>
            <button
              className="px-5 py-2 text-sm rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-purple-500/25 flex items-center gap-2"
              onClick={handleSave}
              disabled={saving || name === (user.name ?? "")}
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

