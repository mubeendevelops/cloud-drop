import { after, afterEach, before, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import File from "../models/File.js";
import { MAX_FILE_SIZE_BYTES } from "../middleware/uploadMiddleware.js";
import {
  api,
  clearDatabase,
  mockCloudinary,
  registerUser,
  startDatabase,
  stopDatabase,
} from "./setup.js";

let cloudinaryMock;

before(startDatabase);
beforeEach(() => {
  cloudinaryMock = mockCloudinary();
});
afterEach(async () => {
  cloudinaryMock.uploadStream.mock.restore();
  cloudinaryMock.destroy.mock.restore();
  await clearDatabase();
});
after(stopDatabase);

const authHeader = (token) => ["Authorization", `Bearer ${token}`];

const upload = (token, content, filename, contentType = "text/plain") =>
  api()
    .post("/api/upload")
    .set(...authHeader(token))
    .attach("file", Buffer.from(content), { filename, contentType });

describe("upload validation", () => {
  it("requires a token", async () => {
    const res = await api()
      .post("/api/upload")
      .attach("file", Buffer.from("hi"), "a.txt");

    assert.equal(res.status, 401);
  });

  it("rejects a request without a file", async () => {
    const { token } = await registerUser();
    const res = await api()
      .post("/api/upload")
      .set(...authHeader(token));

    assert.equal(res.status, 400);
    assert.equal(res.body.message, "No file uploaded");
  });

  it("rejects a file sent under the wrong field name", async () => {
    const { token } = await registerUser();
    const res = await api()
      .post("/api/upload")
      .set(...authHeader(token))
      .attach("document", Buffer.from("hi"), "a.txt");

    assert.equal(res.status, 400);
  });

  it("rejects a file over the size limit with 413", async () => {
    const { token } = await registerUser();
    const res = await upload(
      token,
      Buffer.alloc(MAX_FILE_SIZE_BYTES + 1),
      "big.bin",
      "application/octet-stream"
    );

    assert.equal(res.status, 413);
    assert.equal(cloudinaryMock.uploadStream.mock.callCount(), 0);
  });

  it("refuses the 51st file before calling Cloudinary", async () => {
    const { res: registered, token } = await registerUser();
    const userId = registered.body.user.id;
    await File.insertMany(
      Array.from({ length: 50 }, (_, i) => ({
        user: userId,
        originalName: `f${i}.txt`,
        fileName: `f${i}.txt`,
        mimeType: "text/plain",
        size: 1,
        cloudinaryUrl: "https://example.com",
        publicId: `cloud-drop/${userId}/f${i}`,
        resourceType: "raw",
      }))
    );

    const res = await upload(token, "one more", "extra.txt");

    assert.equal(res.status, 403);
    assert.match(res.body.message, /limit of 50 files/);
    assert.equal(cloudinaryMock.uploadStream.mock.callCount(), 0);
  });
});

describe("upload", () => {
  it("stores a text file as raw under a per-user id with its extension", async () => {
    const { res: registered, token } = await registerUser();
    const userId = registered.body.user.id;

    const res = await upload(token, "hello", "Notes – é.txt");

    assert.equal(res.status, 201);
    assert.equal(res.body.originalName, "Notes – é.txt");
    assert.equal(res.body.size, 5);
    assert.equal(res.body.resourceType, "raw");
    assert.match(
      res.body.publicId,
      new RegExp(`^cloud-drop/${userId}/[0-9a-f-]{36}\\.txt$`)
    );

    const [options] = cloudinaryMock.uploadStream.mock.calls[0].arguments;
    assert.equal(options.resource_type, "raw");
  });

  it("sends images to Cloudinary with resource_type auto", async () => {
    const { token } = await registerUser();
    const res = await upload(token, "png-bytes", "photo.png", "image/png");

    assert.equal(res.status, 201);
    assert.equal(res.body.resourceType, "image");
    const [options] = cloudinaryMock.uploadStream.mock.calls[0].arguments;
    assert.equal(options.resource_type, "auto");
  });
});

describe("file ownership", () => {
  let owner;
  let other;
  let fileId;

  beforeEach(async () => {
    owner = await registerUser();
    other = await registerUser();
    const res = await upload(owner.token, "private", "private.txt");
    fileId = res.body._id;
  });

  it("lists only the caller's own files", async () => {
    const ownerList = await api()
      .get("/api/files")
      .set(...authHeader(owner.token));
    const otherList = await api()
      .get("/api/files")
      .set(...authHeader(other.token));

    assert.equal(ownerList.status, 200);
    assert.deepEqual(
      ownerList.body.map((file) => file._id),
      [fileId]
    );
    assert.equal(otherList.status, 200);
    assert.deepEqual(otherList.body, []);
  });

  it("hides another user's file with 404 on read and delete", async () => {
    const read = await api()
      .get(`/api/files/${fileId}`)
      .set(...authHeader(other.token));
    const remove = await api()
      .delete(`/api/files/${fileId}`)
      .set(...authHeader(other.token));

    assert.equal(read.status, 404);
    assert.equal(remove.status, 404);
    assert.equal(cloudinaryMock.destroy.mock.callCount(), 0);
    assert.ok(await File.exists({ _id: fileId }));
  });

  it("lets the owner read and delete the file", async () => {
    const read = await api()
      .get(`/api/files/${fileId}`)
      .set(...authHeader(owner.token));
    assert.equal(read.status, 200);
    assert.equal(read.body.originalName, "private.txt");

    const remove = await api()
      .delete(`/api/files/${fileId}`)
      .set(...authHeader(owner.token));
    assert.equal(remove.status, 200);

    const [publicId, options] = cloudinaryMock.destroy.mock.calls[0].arguments;
    assert.equal(publicId, read.body.publicId);
    assert.equal(options.resource_type, "raw");
    assert.equal(await File.exists({ _id: fileId }), null);

    const again = await api()
      .get(`/api/files/${fileId}`)
      .set(...authHeader(owner.token));
    assert.equal(again.status, 404);
  });

  it("answers 400 for a malformed id and 404 for an unknown one", async () => {
    const malformed = await api()
      .get("/api/files/not-an-id")
      .set(...authHeader(owner.token));
    const unknown = await api()
      .get(`/api/files/${new mongoose.Types.ObjectId()}`)
      .set(...authHeader(owner.token));

    assert.equal(malformed.status, 400);
    assert.equal(unknown.status, 404);
  });
});
