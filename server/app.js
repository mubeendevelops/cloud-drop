import express from "express";
import cors from "cors";
import morgan from "morgan";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes.js";
import fileRoutes from "./routes/fileRoutes.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const isProduction = process.env.NODE_ENV === "production";

const normalizeOrigin = (origin) => origin.trim().replace(/\/+$/, "");

const allowedOrigins = (process.env.CLIENT_URLS || "")
  .split(",")
  .map(normalizeOrigin)
  .filter(Boolean);

if (isProduction && allowedOrigins.length === 0) {
  console.warn(
    "CLIENT_URLS is empty: every browser origin will be blocked in production."
  );
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Requests without an Origin header (curl, health checks) are not CORS
      if (!origin) return callback(null, true);
      // An empty list is only open outside production
      if (allowedOrigins.length === 0 && !isProduction) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(normalizeOrigin(origin))) {
        return callback(null, true);
      }
      const error = new Error("Not allowed by CORS");
      error.statusCode = 403;
      return callback(error);
    },
  })
);

if (!isProduction) {
  app.use(morgan("dev"));
}

app.get("/", (_req, res) => {
  res.json({
    name: "Cloud Drop API",
    status: "OK",
    endpoints: [
      "/api/auth/register",
      "/api/auth/login",
      "/api/auth/me",
      "/api/upload",
      "/api/files",
    ],
  });
});

const DB_STATES = ["disconnected", "connected", "connecting", "disconnecting"];

app.get("/health", (_req, res) => {
  const db = DB_STATES[mongoose.connection.readyState] || "unknown";
  res.json({ status: db === "connected" ? "ok" : "degraded", db });
});

app.use("/api/auth", authRoutes);
app.use("/api", fileRoutes);

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});

export default app;
