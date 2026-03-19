import { Router } from "express";
import { createProxyMiddleware, Options } from "http-proxy-middleware";
import { validateJwt } from "../middleware/auth";

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:3001";
const WORKFLOW_SERVICE_URL = process.env.WORKFLOW_SERVICE_URL || "http://localhost:3002";
const EXECUTION_SERVICE_URL = process.env.EXECUTION_SERVICE_URL || "http://localhost:3003";
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || "http://localhost:3006";
const REALTIME_SERVICE_URL = process.env.REALTIME_SERVICE_URL || "http://localhost:3010";

function proxy(target: string, pathFilter: string): ReturnType<typeof createProxyMiddleware> {
  const options: Options = {
    target,
    changeOrigin: true,
    pathFilter,
    on: {
      proxyReq: (_proxyReq, req) => {
        console.log(`[proxy] ${req.method} ${(req as any).originalUrl || req.url} → ${target}`);
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
router.use(proxy(AUTH_SERVICE_URL, "/auth/**"));

// Protected routes — JWT required, then proxy
router.use("/workflows", validateJwt);
router.use(proxy(WORKFLOW_SERVICE_URL, "/workflows/**"));

router.use("/execute", validateJwt);
router.use(proxy(EXECUTION_SERVICE_URL, "/execute/**"));

router.use("/notifications", validateJwt);
router.use(proxy(NOTIFICATION_SERVICE_URL, "/notifications/**"));

router.use("/realtime", validateJwt);
router.use(proxy(REALTIME_SERVICE_URL, "/realtime/**"));

export default router;
