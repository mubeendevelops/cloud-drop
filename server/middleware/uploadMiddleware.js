import multer from "multer";

// Cloudinary's free plan caps image and raw uploads at 10 MB. The client
// checks the same number in client/src/utils/fileUtils.js.
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const storage = multer.memoryStorage();

const limits = {
  fileSize: MAX_FILE_SIZE_BYTES,
};

const upload = multer({
  storage,
  limits,
});

const handleSingle = upload.single("file");

export const uploadSingle = (req, res, next) => {
  handleSingle(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        error.statusCode = 413;
        error.message = `File is too large. The limit is ${
          MAX_FILE_SIZE_BYTES / (1024 * 1024)
        } MB.`;
      } else {
        error.statusCode = 400;
      }
    }
    next(error);
  });
};
