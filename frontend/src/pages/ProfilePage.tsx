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
    <div className="max-w-4xl space-y-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Профиль пользователя</h2>
        <p className="text-slate-400">Управление вашей учетной записью и персональными данными</p>
      </div>

      {loading && <div className="text-sm text-slate-400">Загрузка профиля...</div>}
      {error && <div className="text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-md p-3">{error}</div>}

      {user && !loading && (
        <>
          {/* Основная информация */}
          <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center gap-6 mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-emerald-400 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                {avatarLetter}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white mb-1">{user.name || 'Пользователь'}</h3>
                <div className="text-sm text-slate-400 mb-2">{user.email}</div>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <div>
                    <span className="font-medium">ID:</span>
                    <span className="font-mono ml-1">{user.id}</span>
                  </div>
                  <div>
                    <span className="font-medium">Статус:</span>
                    <span className="ml-1 text-green-400">Активен</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Имя пользователя
                </label>
                <input
                  className="w-full text-sm bg-slate-900/60 border border-slate-700 rounded-md px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ваше имя"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email адрес
                </label>
                <div className="text-sm text-slate-200 bg-slate-900/60 border border-slate-700 rounded-md px-4 py-2.5">
                  {user.email}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                className="px-6 py-2.5 text-sm rounded-md bg-purple-600 hover:bg-purple-700 text-white font-medium disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-purple-500/25"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Сохранение..." : "Сохранить изменения"}
              </button>
            </div>
          </div>

          {/* Дополнительная информация */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-white mb-3">Аккаунт</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Тип:</span>
                  <span className="text-white">Личный</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Создан:</span>
                  <span className="text-white">{new Date().toLocaleDateString('ru-RU')}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-white mb-3">Активность</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Workflow:</span>
                  <span className="text-white">0</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Запуски:</span>
                  <span className="text-white">0</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-white mb-3">Безопасность</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">OAuth:</span>
                  <span className="text-green-400">Подключен</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">2FA:</span>
                  <span className="text-slate-500">Отключено</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {!user && !loading && (
        <div className="text-center py-12 bg-slate-800/60 border border-slate-700 rounded-lg">
          <div className="text-slate-400 mb-2">
            Данные профиля не загружены
          </div>
          <div className="text-sm text-slate-500">
            Попробуйте обновить страницу или войти снова
          </div>
        </div>
      )}
    </div>
  );
};

