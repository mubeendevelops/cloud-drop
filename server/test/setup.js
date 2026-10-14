// Shared test setup: an in-memory MongoDB, fake config, and a Cloudinary
// uploader that never leaves the process. Import this before anything else.
import { mock } from "node:test";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret";
process.env.JWT_EXPIRE = "1h";
process.env.CLIENT_URLS = "http://localhost:5173";
process.env.CLOUDINARY_CLOUD_NAME = "test-cloud";
process.env.CLOUDINARY_API_KEY = "test-key";
process.env.CLOUDINARY_API_SECRET = "test-secret";

const { default: app } = await import("../app.js");
const { default: cloudinary } = await import("../config/cloudinary.js");

export { app };

let mongoServer;

export const startDatabase = async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
};

export const stopDatabase = async () => {
  await mongoose.disconnect();
  await mongoServer?.stop();
};

export const clearDatabase = async () => {
  const collections = Object.values(mongoose.connection.collections);
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
};

// Replaces the two uploader calls the app makes. The returned mocks record
// every call, so tests can check what would have been sent to Cloudinary.
export const mockCloudinary = () => {
  const uploadStream = mock.method(
    cloudinary.uploader,
    "upload_stream",
    (options, callback) => ({
      end: () => {
        const resourceType =
          options.resource_type === "auto" ? "image" : options.resource_type;
        const publicId = `${options.folder}/${options.public_id}`;
        setImmediate(() =>
          callback(null, {
            public_id: publicId,
            resource_type: resourceType,
            secure_url: `https://res.cloudinary.com/test-cloud/${resourceType}/upload/${publicId}`,
          })
        );
      },
    })
  );
  const destroy = mock.method(cloudinary.uploader, "destroy", async () => ({
    result: "ok",
  }));
  return { uploadStream, destroy };
};

// The auth routes are rate limited per IP (with "trust proxy" on), so each
// request gets its own address to keep tests independent of the limiter.
let ipCounter = 0;
const nextIp = () => {
  ipCounter += 1;
  return `10.0.${Math.floor(ipCounter / 250)}.${(ipCounter % 250) + 1}`;
};

export const api = () => request(app);

export const registerUser = async (overrides = {}) => {
  const body = {
    email: `user${Date.now()}${Math.random().toString(16).slice(2)}@example.com`,
    password: "secret123",
    name: "Test User",
    ...overrides,
  };
  const res = await api()
    .post("/api/auth/register")
    .set("X-Forwarded-For", nextIp())
    .send(body);
  return { res, body, token: res.body.token };
};

export const login = (email, password) =>
  api()
    .post("/api/auth/login")
    .set("X-Forwarded-For", nextIp())
    .send({ email, password });
