import React, { useEffect, useState, useCallback } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { userApi } from "../api/user";

export const ProfilePage: React.FC = () => {
  const { user, fetchUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  // Memoize fetchUser to prevent infinite re-renders
  const memoizedFetchUser = useCallback(fetchUser, [fetchUser]);

  useEffect(() => {
    setLoading(true);
    setError(undefined);
    memoizedFetchUser()
      .then(() => setName(user?.name ?? ""))
      .catch(() => setError("Failed to load profile"))
      .finally(() => setLoading(false));
  }, [memoizedFetchUser]);

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    setError(undefined);
    try {
      await userApi.updateMe({ name });
      await fetchUser(); // Refresh user data
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const avatarLetter =
    user?.name?.[0] ??
    user?.email?.[0]?.toUpperCase() ??
    "?";

  return (
    <div className="max-w-xl space-y-6">
      <h3 className="text-base font-semibold mb-2">Profile</h3>

      {loading && <div className="text-sm text-slate-400">Loading profile...</div>}
      {error && <div className="text-sm text-red-400">{error}</div>}

      {user && !loading && (
        <>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-500 to-emerald-400 flex items-center justify-center text-lg font-semibold text-slate-50">
              {avatarLetter}
            </div>
            <div>
              <div className="text-xs text-slate-400">User ID</div>
              <div className="text-xs font-mono text-slate-200">
                {user.id}
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Email
              </label>
              <div className="text-sm text-slate-200 bg-slate-900/60 border border-slate-800 rounded-md px-3 py-2">
                {user.email}
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Name
              </label>
              <input
                className="w-full text-sm bg-slate-950/60 border border-slate-800 rounded-md px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              className="px-4 py-2 text-xs rounded-md bg-primary-600 hover:bg-primary-700 disabled:opacity-60"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </>
      )}

      {!user && !loading && (
        <div className="text-sm text-slate-400">
          No user data available. Please try refreshing the page.
        </div>
      )}
    </div>
  );
};

