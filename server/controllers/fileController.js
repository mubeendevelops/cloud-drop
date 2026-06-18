import cloudinary from "../config/cloudinary.js";
import File from "../models/File.js";

const uploadBufferToCloudinary = (buffer, originalName, mimeType) => {
  return new Promise((resolve, reject) => {
    const publicIdBase =
      originalName.split(".").slice(0, -1).join(".") || originalName;
    cloudinary.uploader
      .upload_stream(
        {
          folder: "cloud-drop",
          resource_type: "auto",
          public_id: publicIdBase,
        },
        (error, result) => {
          if (error) {
            return reject(error);
          }
          resolve(result);
        }
      )
      .end(buffer);
  });
};

export const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      const error = new Error("No file uploaded");
      error.statusCode = 400;
      throw error;
    }

    const { originalname, mimetype, size, buffer } = req.file;

    const uploadResult = await uploadBufferToCloudinary(
      buffer,
      originalname,
      mimetype
    );

    const fileDoc = await File.create({
      user: req.user.userId,
      originalName: originalname,
      fileName: uploadResult.original_filename || originalname,
      mimeType: mimetype,
      size,
      cloudinaryUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      resourceType: uploadResult.resource_type,
    });

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
    const file = await File.findOne({
      _id: id,
      user: req.user.userId,
    }).lean();
    if (!file) {
      const error = new Error("File not found");
      error.statusCode = 404;
      throw error;
    }
    res.json(file);
  } catch (error) {
    next(error);
  }
};

export const deleteFileById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const file = await File.findOne({
      _id: id,
      user: req.user.userId,
    });
    if (!file) {
      const error = new Error("File not found");
      error.statusCode = 404;
      throw error;
    }

    // resource_type must match what was used at upload time; destroy() silently
    // returns {result:'not found'} rather than throwing when the type is wrong.
    const resourceType = file.resourceType || "image";
    const destroyResult = await cloudinary.uploader.destroy(file.publicId, {
      resource_type: resourceType,
    });

    // For legacy records that predate resourceType storage, fall back through
    // the remaining valid types so the asset is actually removed.
    if (destroyResult.result !== "ok") {
      const fallbackTypes = ["image", "video", "raw"].filter(
        (t) => t !== resourceType
      );
      for (const rt of fallbackTypes) {
        const fallback = await cloudinary.uploader.destroy(file.publicId, {
          resource_type: rt,
        });
        if (fallback.result === "ok") break;
      }
    }

    await file.deleteOne();

    res.json({ message: "File deleted successfully" });
  } catch (error) {
    next(error);
  }
};
