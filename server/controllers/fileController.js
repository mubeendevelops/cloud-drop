import crypto from "crypto";
import path from "path";
import mongoose from "mongoose";
import cloudinary from "../config/cloudinary.js";
import File from "../models/File.js";

const UPLOAD_FOLDER = "cloud-drop";

// Registration is open, so each account gets a fixed share of the Cloudinary
// quota. Checked before anything is sent to Cloudinary.
const MAX_FILES_PER_USER = 50;
const MAX_STORAGE_BYTES_PER_USER = 100 * 1024 * 1024;

const BYTES_PER_MB = 1024 * 1024;

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

// Cloudinary rejects with a plain object ({ message, http_code }). Pass its
// 4xx codes on, except 401/403: those mean our own credentials are wrong, and
// the client treats a 401 as an expired session.
const toHttpError = (cloudinaryError) => {
  const code = cloudinaryError?.http_code;
  const message = cloudinaryError?.message || "Cloudinary request failed";
  if (code === 499) return createError("Upload to storage timed out", 504);
  if (code >= 400 && code < 500 && code !== 401 && code !== 403) {
    return createError(message, code);
  }
  console.error("Cloudinary error:", code, message);
  return createError("File storage request failed", 500);
};

// Multer 1.x decodes multipart file names as latin1, which garbles UTF-8
const decodeOriginalName = (name) => {
  const decoded = Buffer.from(name, "latin1").toString("utf8");
  return decoded.includes("\uFFFD") ? name : decoded;
};

// Lower-case extension with the dot, or "" when it is missing or unusual
const getSafeExtension = (name) => {
  const ext = path.extname(name).toLowerCase();
  return /^\.[a-z0-9]{1,10}$/.test(ext) ? ext : "";
};

// Types Cloudinary stores as image or video assets (it treats PDF as image and
// audio as video). Everything else is stored as-is under the "raw" type.
const isMediaType = (mimeType) =>
  /^(image|video|audio)\//.test(mimeType) || mimeType === "application/pdf";

const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

const getUsage = async (userId) => {
  const [usage] = await File.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    { $group: { _id: null, count: { $sum: 1 }, bytes: { $sum: "$size" } } },
  ]);
  return usage || { count: 0, bytes: 0 };
};

// Concurrent uploads can each pass this check, so the cap can be overshot by
// a file or two; that is acceptable for a quota guard.
const assertWithinQuota = async (userId, newFileSize) => {
  const { count, bytes } = await getUsage(userId);
  if (count >= MAX_FILES_PER_USER) {
    throw createError(
      `You have reached the limit of ${MAX_FILES_PER_USER} files. Delete some files to upload more.`,
      403
    );
  }
  if (bytes + newFileSize > MAX_STORAGE_BYTES_PER_USER) {
    const usedMb = (bytes / BYTES_PER_MB).toFixed(1);
    const limitMb = MAX_STORAGE_BYTES_PER_USER / BYTES_PER_MB;
    throw createError(
      `This file would exceed your ${limitMb} MB storage limit (${usedMb} MB used). Delete some files to upload more.`,
      403
    );
  }
};

const uploadStream = (buffer, options) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(options, (error, result) => {
        if (error) {
          return reject(toHttpError(error));
        }
        resolve(result);
      })
      .end(buffer);
  });
};

const destroyAsset = async (publicId, resourceType) => {
  try {
    return await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      invalidate: true,
    });
  } catch (error) {
    throw toHttpError(error);
  }
};

// The public id is <userId>/<random id>, never the file name, so uploads can
// not collide or overwrite each other. Raw assets are served under their
// public id exactly, so they get the original extension appended.
const uploadBufferToCloudinary = async (buffer, userId, originalName, mimeType) => {
  const baseId = `${userId}/${crypto.randomUUID()}`;
  const ext = getSafeExtension(originalName);

  if (!isMediaType(mimeType)) {
    const uploadRaw = (publicId) =>
      uploadStream(buffer, {
        folder: UPLOAD_FOLDER,
        resource_type: "raw",
        public_id: publicId,
      });
    try {
      return await uploadRaw(`${baseId}${ext}`);
    } catch (error) {
      // Cloudinary refuses some raw extensions (bin, exe, ...). Store those
      // without one; the original name is still kept in MongoDB.
      if (ext && /extension .* not allowed/i.test(error.message)) {
        return uploadRaw(baseId);
      }
      throw error;
    }
  }

  const result = await uploadStream(buffer, {
    folder: UPLOAD_FOLDER,
    resource_type: "auto",
    public_id: baseId,
  });

  // Cloudinary can still decide a "media" file is raw (an image format it does
  // not know); give it its extension after the fact.
  if (result.resource_type === "raw" && ext) {
    try {
      return await cloudinary.uploader.rename(
        result.public_id,
        `${result.public_id}${ext}`,
        { resource_type: "raw" }
      );
    } catch (error) {
      console.error("Could not add extension to raw asset:", error?.message);
    }
  }
  return result;
};

export const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      throw createError("No file uploaded", 400);
    }

    const { mimetype, size, buffer } = req.file;
    const originalName = decodeOriginalName(req.file.originalname);

    await assertWithinQuota(req.user.userId, size);

    const uploadResult = await uploadBufferToCloudinary(
      buffer,
      req.user.userId,
      originalName,
      mimetype
    );

    let fileDoc;
    try {
      fileDoc = await File.create({
        user: req.user.userId,
        originalName,
        fileName: uploadResult.public_id.split("/").pop(),
        mimeType: mimetype,
        size,
        cloudinaryUrl: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        resourceType: uploadResult.resource_type,
      });
    } catch (error) {
      // Do not leave an asset behind that no record points to
      await destroyAsset(
        uploadResult.public_id,
        uploadResult.resource_type
      ).catch((cleanupError) => {
        console.error(
          "Could not remove orphaned asset:",
          uploadResult.public_id,
          cleanupError?.message
        );
      });
      throw error;
    }

    res.status(201).json(fileDoc);
  } catch (error) {
    next(error);
  }
};

export const getFiles = async (req, res, next) => {
  try {
    const files = await File.find({ user: req.user.userId })
      .sort({ createdAt: -1 })
      .lean();
    res.json(files);
  } catch (error) {
    next(error);
  }
};

export const getFileById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      throw createError("Invalid file id", 400);
    }
    const file = await File.findOne({
      _id: id,
      user: req.user.userId,
    }).lean();
    if (!file) {
      throw createError("File not found", 404);
    }
    res.json(file);
  } catch (error) {
    next(error);
  }
};

export const deleteFileById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      throw createError("Invalid file id", 400);
    }

    const file = await File.findOne({
      _id: id,
      user: req.user.userId,
    });
    if (!file) {
      throw createError("File not found", 404);
    }

    // resource_type must match what was used at upload time; destroy() silently
    // returns {result:'not found'} rather than throwing when the type is wrong.
    const resourceType = file.resourceType || "image";
    const destroyResult = await destroyAsset(file.publicId, resourceType);

    // For legacy records that predate resourceType storage, fall back through
    // the remaining valid types so the asset is actually removed.
    if (destroyResult.result !== "ok") {
      const fallbackTypes = ["image", "video", "raw"].filter(
        (t) => t !== resourceType
      );
      for (const rt of fallbackTypes) {
        const fallback = await destroyAsset(file.publicId, rt);
        if (fallback.result === "ok") break;
      }
    }

    await file.deleteOne();

    res.json({ message: "File deleted successfully" });
  } catch (error) {
    next(error);
  }
};
