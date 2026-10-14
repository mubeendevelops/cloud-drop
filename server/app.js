import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes.js";
import fileRoutes from "./routes/fileRoutes.js";

const app = express();

// Render puts one proxy in front of the app; trust it so req.ip (and the auth
// rate limiter) sees the real client address rather than the proxy's.
app.set("trust proxy", 1);

app.use(helmet());
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

if (!isProduction && process.env.NODE_ENV !== "test") {
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

// Mongoose errors carry no statusCode; map the ones caused by bad input
const getStatusCode = (err) => {
  if (err.statusCode) return err.statusCode;
  if (err instanceof mongoose.Error.ValidationError) return 400;
  if (err instanceof mongoose.Error.CastError) return 400;
  if (err.code === 11000) return 409;
  return 500;
};

const GENERIC_SERVER_ERROR = "Something went wrong on the server. Please try again.";

const getClientMessage = (err, status) => {
  // Internal details stay in the server log
  if (status === 500) return GENERIC_SERVER_ERROR;
  if (err instanceof mongoose.Error.ValidationError) {
    return Object.values(err.errors)
      .map((fieldError) => fieldError.message)
      .join(", ");
  }
  if (err instanceof mongoose.Error.CastError) return `Invalid ${err.path}`;
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    return field
      ? `A record with this ${field} already exists`
      : "That record already exists";
  }
  return err.message || "Request failed";
};

app.use((err, _req, res, _next) => {
  const status = getStatusCode(err);
  if (status >= 500) {
    console.error(err);
  } else {
    console.warn(`${status} ${err.name}: ${err.message}`);
  }
  res.status(status).json({ message: getClientMessage(err, status) });
});

export default app;
