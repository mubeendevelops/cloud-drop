import rateLimit from "express-rate-limit";

const AUTH_WINDOW_MINUTES = 15;
const AUTH_MAX_ATTEMPTS = 10;

// Each route gets its own counter, keyed by client IP (see "trust proxy" in
// app.js). Every attempt counts, successful or not.
const createAuthLimiter = () =>
  rateLimit({
    windowMs: AUTH_WINDOW_MINUTES * 60 * 1000,
    limit: AUTH_MAX_ATTEMPTS,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: (_req, _res, next) => {
      const error = new Error(
        `Too many attempts. Please try again in ${AUTH_WINDOW_MINUTES} minutes.`
      );
      error.statusCode = 429;
      next(error);
    },
  });

export const loginLimiter = createAuthLimiter();
export const registerLimiter = createAuthLimiter();
