import { Router } from "express";
import { createProxyMiddleware, Options } from "http-proxy-middleware";
import { validateJwt } from "../middleware/auth";

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:3001";
const WORKFLOW_SERVICE_URL = process.env.WORKFLOW_SERVICE_URL || "http://localhost:3002";
const EXECUTION_SERVICE_URL = process.env.EXECUTION_SERVICE_URL || "http://localhost:3003";
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || "http://localhost:3006";
const REALTIME_SERVICE_URL = process.env.REALTIME_SERVICE_URL || "http://localhost:3010";

function proxy(target: string, pathRewrite?: Record<string, string>): ReturnType<typeof createProxyMiddleware> {
  const options: Options = {
    target,
    changeOrigin: true,
    pathRewrite,
    on: {
      proxyReq: (_proxyReq, req) => {
        console.log(`[proxy] ${req.method} ${req.url} → ${target}`);
      },
      error: (err, _req, res) => {
        console.error(`[proxy] Error: ${err.message}`);
        if ("writeHead" in res) {
          (res as any).status(502).json({ message: "Service unavailable" });
        }
      },
    },
  };

  return createProxyMiddleware(options) as any;
}

const router = Router();

// Auth routes — no JWT required (login/register are public)
router.use("/auth", proxy(AUTH_SERVICE_URL));

// Protected routes — JWT required
router.use("/workflows", validateJwt, proxy(WORKFLOW_SERVICE_URL));
router.use("/execute", validateJwt, proxy(EXECUTION_SERVICE_URL));
router.use("/notifications", validateJwt, proxy(NOTIFICATION_SERVICE_URL));
router.use("/realtime", validateJwt, proxy(REALTIME_SERVICE_URL));

export default router;
