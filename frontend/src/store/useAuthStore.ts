import { create } from "zustand";
import { api } from "../api/client";

type User = {
  id: string;
  email: string;
  name?: string | null;
};

type AuthState = {
  token: string | null;
  user: User | null;
  loading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
  setToken: (token: string) => void;
  clearError: () => void;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem("token"),
  user: null,
  loading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post("/auth/login", { email, password });
      const { token, user } = res.data;
      localStorage.setItem("token", token);
      set({ token, user, loading: false });
    } catch (err: any) {
      const message = err.response?.data?.message || "Login failed";
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  register: async (email: string, password: string, name: string) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post("/auth/register", { email, password, name });
      const { token, user } = res.data;
      localStorage.setItem("token", token);
      set({ token, user, loading: false });
    } catch (err: any) {
      const message = err.response?.data?.message || "Registration failed";
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  logout: () => {
    localStorage.removeItem("token");
    set({ token: null, user: null, error: null });
  },

  fetchUser: async () => {
    const { token } = get();
    if (!token) return;
    set({ loading: true });
    try {
      const res = await api.get("/auth/me");
      set({ user: res.data, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  setToken: (token: string) => {
    localStorage.setItem("token", token);
    set({ token });
  },

  clearError: () => set({ error: null }),
}));
