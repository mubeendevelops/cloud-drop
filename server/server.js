import "dotenv/config";

import http from "http";
import app from "./app.js";
import connectDB from "./config/db.js";
import { getMissingEnvVars } from "./config/env.js";

const PORT = process.env.PORT || 5000;

const start = async () => {
  const missing = getMissingEnvVars();
  if (missing.length > 0) {
    console.error(
      `FATAL: missing required environment variables: ${missing.join(", ")}`
    );
    process.exit(1);
  }

  try {
    await connectDB();
  } catch (error) {
    console.error(`FATAL: could not connect to MongoDB: ${error.message}`);
    process.exit(1);
  }

  const server = http.createServer(app);

  server.listen(PORT, () => {
    console.log(`Cloud Drop backend running on port ${PORT}`);
  });
};

start();
