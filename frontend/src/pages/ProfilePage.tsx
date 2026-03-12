import React, { useEffect, useState } from "react";
import { userApi, MeResponse } from "../api/user";

export const ProfilePage: React.FC = () => {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(undefined);
    userApi
      .getMe()
      .then((data) => {
        setMe(data);
        setName(data.name ?? "");
      })
      .catch((err) =>
        setError(
          err instanceof Error ? err.message : "Failed to load profile"
        )
      )
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(undefined);
    try {
      const updated = await userApi.updateMe({ name });
      setMe(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const avatarLetter =
    me?.name?.[0] ??
    me?.email?.[0]?.toUpperCase() ??
    "?";

  const plan = me?.subscription?.plan ?? "FREE";
  const trialEndsAt = me?.subscription?.trialEndsAt
    ? new Date(me.subscription.trialEndsAt)
    : null;

  return (
    <div className="max-w-xl space-y-6">
      <h3 className="text-base font-semibold mb-2">Profile</h3>

      {loading && <div className="text-sm text-slate-400">Loading...</div>}
      {error && <div className="text-sm text-red-400">{error}</div>}

      {me && (
        <>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-500 to-emerald-400 flex items-center justify-center text-lg font-semibold text-slate-50">
              {avatarLetter}
            </div>
            <div>
              <div className="text-xs text-slate-400">User ID</div>
              <div className="text-xs font-mono text-slate-200">
                {me.id}
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Email
              </label>
              <div className="text-sm text-slate-200 bg-slate-900/60 border border-slate-800 rounded-md px-3 py-2">
                {me.email}
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

          <div className="mt-4 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
            <div className="text-xs text-slate-400 mb-1">
              Subscription
            </div>
            <div className="flex items-center justify-between text-sm">
              <div>
                <div className="font-medium text-slate-100">
                  {plan}
                </div>
                <div className="text-xs text-slate-400">
                  Status: {me.subscription?.status ?? "none"}
                </div>
                {trialEndsAt && (
                  <div className="text-xs text-slate-400">
                    Trial ends: {trialEndsAt.toLocaleDateString()}
                  </div>
                )}
              </div>
              <span className="px-2 py-0.5 rounded-full text-[11px] bg-primary-500/10 text-primary-300 border border-primary-500/40">
                {plan === "FREE" ? "Free plan" : "Pro plan"}
              </span>
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
    </div>
  );
};

