import multer from "multer";

const storage = multer.memoryStorage();

const limits = {
  fileSize: 50 * 1024 * 1024,
};

const upload = multer({
  storage,
  limits,
});

export const uploadSingle = upload.single("file");
