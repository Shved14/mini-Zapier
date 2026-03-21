import { create } from "zustand";
import { api } from "../api/client";

type User = {
  id: string;
  email: string;
  name?: string | null;
  provider?: string;
  avatarUrl?: string | null;
  plan?: string;
  createdAt?: string;
};

type AuthState = {
  token: string | null;
  user: User | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;
  retryCount: number;

  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<{ needsVerification: boolean }>;
  verifyEmail: (email: string, code: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
  setToken: (token: string) => void;
  clearError: () => void;
  initialize: () => Promise<void>;
  retryFetchUser: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem("token"),
  user: null,
  loading: false,
  initialized: false,
  error: null,
  retryCount: 0,

  login: async (email: string, password: string) => {
    console.log("[Auth] Starting login for:", email);
    set({ loading: true, error: null });
    try {
      const res = await api.post("/auth/login", { email, password });
      const { token, user } = res.data;
      console.log("[Auth] Login successful, token received:", !!token, "user:", user?.email);
      localStorage.setItem("token", token);
      set({ token, user, loading: false, error: null, retryCount: 0 });
      console.log("[Auth] Login state updated - token stored in localStorage");
    } catch (err: any) {
      console.error("[Auth] Login failed:", err);
      const message = err.response?.data?.message || "Login failed";
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  register: async (email: string, password: string, name: string) => {
    console.log("[Auth] Starting registration for:", email);
    set({ loading: true, error: null });
    try {
      await api.post("/auth/register", { email, password, name });
      console.log("[Auth] Registration successful");
      set({ loading: false });
      return { needsVerification: true };
    } catch (err: any) {
      console.error("[Auth] Registration failed:", err);
      const message = err.response?.data?.message || "Registration failed";
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  verifyEmail: async (email: string, code: string, password: string, name: string) => {
    console.log("[Auth] Starting email verification");
    set({ loading: true, error: null });
    try {
      const res = await api.post("/auth/verify-email", { email, code, password, name });
      const { token, user } = res.data;
      console.log("[Auth] Email verification successful");
      localStorage.setItem("token", token);
      set({ token, user, loading: false });
    } catch (err: any) {
      console.error("[Auth] Email verification failed:", err);
      const message = err.response?.data?.message || "Verification failed";
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  logout: () => {
    console.log("[Auth] Logging out - clearing token and user state");
    localStorage.removeItem("token");
    set({ token: null, user: null, error: null, initialized: true, retryCount: 0 });
    console.log("[Auth] Logout complete - token removed from localStorage");
  },

  fetchUser: async () => {
    const { token } = get();
    if (!token) {
      console.log("[Auth] No token, skipping fetchUser");
      return;
    }

    console.log("[Auth] Fetching user data");
    set({ loading: true });
    try {
      const res = await api.get("/auth/me");
      console.log("[Auth] User data fetched successfully:", res.data.email);
      set({ user: res.data, loading: false, initialized: true, error: null });
    } catch (error: any) {
      console.error("[Auth] Failed to fetch user:", error);

      // Handle different error types
      if (!error.response) {
        // Network error - don't logout, just set error state
        console.log("[Auth] Network error - keeping token and setting error state");
        set({ loading: false, error: "Network connection failed", initialized: true });
      } else if (error.response?.status === 401) {
        // Token is invalid - clear it
        console.log("[Auth] 401 error - clearing token");
        localStorage.removeItem("token");
        set({ token: null, user: null, loading: false, error: "Session expired", initialized: true });
      } else {
        // Other HTTP error - keep token but set error
        console.log("[Auth] HTTP error - keeping token");
        set({ loading: false, error: "Server error", initialized: true });
      }
    }
  },

  setToken: (token: string) => {
    console.log("[Auth] Setting token:", !!token, "length:", token?.length);
    localStorage.setItem("token", token);
    set({ token });
    console.log("[Auth] Token stored in localStorage and state");
  },

  clearError: () => set({ error: null }),

  initialize: async () => {
    const { token, initialized, fetchUser } = get();
    if (initialized) {
      console.log("[Auth] Already initialized");
      return;
    }

    console.log("[Auth] Initializing auth state");
    if (token) {
      console.log("[Auth] Token found, fetching user");
      await fetchUser();
    } else {
      console.log("[Auth] No token found");
      set({ initialized: true });
    }
  },

  retryFetchUser: async () => {
    const { retryCount } = get();
    if (retryCount >= 3) {
      console.log("[Auth] Max retry attempts reached");
      return;
    }

    console.log(`[Auth] Retrying fetch user (attempt ${retryCount + 1})`);
    set({ retryCount: retryCount + 1, error: null });

    try {
      await get().fetchUser();
      set({ retryCount: 0 }); // Reset on success
    } catch (error) {
      console.log("[Auth] Retry failed");
    }
  },
}));
