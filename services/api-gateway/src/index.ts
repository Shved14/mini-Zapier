import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import proxyRoutes from "./routes/proxy";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
// NOTE: Do NOT add express.json() here — the gateway is a pure proxy.
// Body parsing would consume the request stream before http-proxy-middleware
// can forward it, causing empty-body errors on downstream services.

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "api-gateway" });
});

app.use("/api", proxyRoutes);

app.use((_req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});
