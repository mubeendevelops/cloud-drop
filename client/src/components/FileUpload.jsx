import React, { useRef, useState } from "react";
import { uploadFile } from "../services/api.js";

const formatBytes = (bytes) => {
  if (!bytes && bytes !== 0) return "";
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
};

const FileUpload = ({ onUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const resetMessages = () => {
    setStatusMessage("");
    setErrorMessage("");
  };

  const handleFileChange = (event) => {
    resetMessages();
    const file = event.target.files?.[0];
    setSelectedFile(file || null);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    resetMessages();
    const file = event.dataTransfer.files?.[0];
    setSelectedFile(file || null);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setErrorMessage("Please choose a file to upload.");
      return;
    }
    try {
      setUploading(true);
      resetMessages();
      await uploadFile(selectedFile);
      setStatusMessage("File uploaded successfully.");
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error.message ||
        "Upload failed. Please try again.";
      setErrorMessage(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    resetMessages();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div>
      <div className="upload-header">
        <div>
          <h2 className="upload-title">Upload a file</h2>
          <div style={{ fontSize: "0.78rem", color: "#9ca3af", marginTop: 4 }}>
            Any file type · Stored in Cloudinary · Metadata in MongoDB
          </div>
        </div>
        <span className="upload-tag">Cloud Drop</span>
      </div>

      <label
        className={`upload-dropzone ${isDragging ? "is-dragging" : ""}`.trim()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="upload-icon">
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M12 16V5m0 0L8 9m4-4 4 4"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M6 15v1.4A2.6 2.6 0 0 0 8.6 19h6.8A2.6 2.6 0 0 0 18 16.4V15"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="upload-text-main">
          Drag &amp; drop a file here, or{" "}
          <span style={{ color: "#38bdf8", fontWeight: 500 }}>browse</span>
        </div>
        <div className="upload-text-sub">
          Max size depends on your Cloudinary & Render plan. All file types are
          accepted.
        </div>

        <input
          ref={fileInputRef}
          type="file"
          style={{ display: "none" }}
          onChange={handleFileChange}
          onClick={(e) => (e.target.value = null)}
        />
      </label>

      <div style={{ marginTop: 12, fontSize: "0.8rem", color: "#9ca3af" }}>
        <button
          type="button"
          className="btn btn-outline"
          style={{ paddingInline: 12, fontSize: "0.78rem" }}
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
        >
          Choose file
        </button>

        {selectedFile && (
          <span className="upload-file-meta">
            <span title={selectedFile.name}>
              <strong>Selected:</strong> {selectedFile.name}
            </span>
            <span>· {formatBytes(selectedFile.size)}</span>
          </span>
        )}
      </div>

      <div className="upload-actions">
        {selectedFile && (
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleClear}
            disabled={uploading}
          >
            Clear
          </button>
        )}
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleUpload}
          disabled={uploading || !selectedFile}
        >
          {uploading ? "Uploading…" : "Upload"}
        </button>
      </div>

      {statusMessage && (
        <div className="alert alert-info" role="status">
          {statusMessage}
        </div>
      )}
      {errorMessage && (
        <div className="alert alert-error" role="alert">
          {errorMessage}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
