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
      originalName: originalname,
      fileName: uploadResult.original_filename || originalname,
      mimeType: mimetype,
      size,
      cloudinaryUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id,
    });

    res.status(201).json(fileDoc);
  } catch (error) {
    next(error);
  }
};

export const getFiles = async (_req, res, next) => {
  try {
    const files = await File.find().sort({ createdAt: -1 }).lean();
    res.json(files);
  } catch (error) {
    next(error);
  }
};

export const getFileById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const file = await File.findById(id).lean();
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

    const file = await File.findById(id);
    if (!file) {
      const error = new Error("File not found");
      error.statusCode = 404;
      throw error;
    }

    await cloudinary.uploader.destroy(file.publicId, {
      resource_type: "raw",
    });

    await file.deleteOne();

    res.json({ message: "File deleted successfully" });
  } catch (error) {
    if (
      error?.http_code === 400 ||
      (error?.message && error.message.includes("Resource not found"))
    ) {
      try {
        const file = await File.findById(req.params.id);
        if (file) {
          await cloudinary.uploader.destroy(file.publicId, {
            resource_type: "auto",
          });
          await file.deleteOne();
          return res.json({ message: "File deleted successfully" });
        }
      } catch (innerError) {
        return next(innerError);
      }
    }
    next(error);
  }
};
