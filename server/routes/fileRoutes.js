import express from "express";
import { uploadSingle } from "../middleware/uploadMiddleware.js";
import {
  uploadFile,
  getFiles,
  getFileById,
  deleteFileById,
} from "../controllers/fileController.js";

const router = express.Router();

router.post("/upload", uploadSingle, uploadFile);
router.get("/files", getFiles);
router.get("/files/:id", getFileById);
router.delete("/files/:id", deleteFileById);

export default router;
