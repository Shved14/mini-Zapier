import { Router } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { validateJwt } from "../middleware/auth";

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:3001";
const WORKFLOW_SERVICE_URL = process.env.WORKFLOW_SERVICE_URL || "http://localhost:3002";
const EXECUTION_SERVICE_URL = process.env.EXECUTION_SERVICE_URL || "http://localhost:3003";
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || "http://localhost:3006";

/**
 * Creates a proxy middleware for a given target service.
 * @param target  - upstream service URL  (e.g. http://auth-service:3001)
 * @param prefix  - the path prefix the target expects (e.g. "/auth")
 *
 * Because this router is mounted at /api and then sub-mounted at /<prefix>,
 * Express strips both prefixes, so req.url inside the middleware is just the
 * remainder (e.g. "/login").  pathRewrite prepends the service prefix back so
 * the upstream service receives the full path it expects.
 *
 * fixRequestBody re-streams the JSON body that express.json() already parsed.
 */
function serviceProxy(target: string, prefix: string) {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: (_path, req) => {
      // req.url is the remainder after Express stripped /api and /<prefix>
      const reconstructed = `${prefix}${req.url}`;
      console.log(`[proxy] ${req.method} ${(req as any).originalUrl || req.url} → ${target}${reconstructed}`);
      return reconstructed;
    },
    on: {
      error: (err, _req, res) => {
        console.error(`[proxy] Error: ${err.message}`);
        if ("writeHead" in res) {
          (res as any).status(502).json({ message: "Service unavailable" });
        }
      },
    },
  }) as any;
}

const router = Router();

// Auth routes — split between public and protected
router.use("/auth/login", serviceProxy(AUTH_SERVICE_URL, "/auth/login"));
router.use("/auth/register", serviceProxy(AUTH_SERVICE_URL, "/auth/register"));
router.use("/auth/verify-email", serviceProxy(AUTH_SERVICE_URL, "/auth/verify-email"));
router.use("/auth/google", serviceProxy(AUTH_SERVICE_URL, "/auth/google"));
router.use("/auth/google/callback", serviceProxy(AUTH_SERVICE_URL, "/auth/google/callback"));
router.use("/auth/github", serviceProxy(AUTH_SERVICE_URL, "/auth/github"));
router.use("/auth/github/callback", serviceProxy(AUTH_SERVICE_URL, "/auth/github/callback"));

// Protected auth routes — JWT required
router.use("/auth/me", validateJwt, serviceProxy(AUTH_SERVICE_URL, "/auth/me"));

// Protected routes — JWT required, then proxy
router.use("/workflows", validateJwt, serviceProxy(WORKFLOW_SERVICE_URL, "/workflows"));
router.use("/runs", validateJwt, serviceProxy(EXECUTION_SERVICE_URL, "/api/runs"));
router.use("/execute", validateJwt, serviceProxy(EXECUTION_SERVICE_URL, "/execute"));
router.use("/workflows/invite/:token", serviceProxy(WORKFLOW_SERVICE_URL, "/workflows/invite/:token"));
router.post("/workflows/invite/:token/accept", validateJwt, serviceProxy(WORKFLOW_SERVICE_URL, "/workflows/invite/:token/accept"));
router.post("/workflows/invite/:token/decline", validateJwt, serviceProxy(WORKFLOW_SERVICE_URL, "/workflows/invite/:token/decline"));

// AI & utility endpoints on execution service
router.use("/explain-error", validateJwt, serviceProxy(EXECUTION_SERVICE_URL, "/api/explain-error"));
router.use("/test-node", validateJwt, serviceProxy(EXECUTION_SERVICE_URL, "/api/test-node"));
router.use("/templates", serviceProxy(EXECUTION_SERVICE_URL, "/api/templates"));

router.use("/notifications", validateJwt, serviceProxy(NOTIFICATION_SERVICE_URL, "/notifications"));

export default router;
