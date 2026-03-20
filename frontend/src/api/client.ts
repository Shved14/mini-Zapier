import axios from "axios";

export const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log("[API] Adding token to request:", config.url);
  } else {
    console.log("[API] No token found for request:", config.url);
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || "";
    const status = error.response?.status;

    console.log("[API] Response error:", url, status, error.code || "no-code");

    // DO NOT auto-logout here.
    // The auth store handles 401 from /auth/me properly.
    // Calling logout() in the interceptor caused a race condition where the
    // user was logged out immediately after login.

    return Promise.reject(error);
  }
);

