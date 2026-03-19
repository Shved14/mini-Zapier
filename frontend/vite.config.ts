import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 3007,
    proxy: {
      "/auth": {
        target: "http://127.0.0.1:3000",
        changeOrigin: true,
        secure: false,
      },
      "/workflows": {
        target: "http://127.0.0.1:3000",
        changeOrigin: true,
        secure: false,
      },
      "/execute": {
        target: "http://127.0.0.1:3000",
        changeOrigin: true,
        secure: false,
      },
      "/notifications": {
        target: "http://127.0.0.1:3000",
        changeOrigin: true,
        secure: false,
      },
      "/health": {
        target: "http://127.0.0.1:3000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
