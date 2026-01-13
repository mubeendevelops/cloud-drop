import React, { useRef, useState } from "react";
import { uploadFile } from "../services/api.js";
import { formatBytes } from "../utils/fileUtils";

const FileUpload = ({ onUploadSuccess, onError, onSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const fileInputRef = useRef(null);
  const dropzoneRef = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadProgress(0);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    setDragCounter(0);
    
    const file = event.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadProgress(0);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleDragEnter = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragCounter((prev) => prev + 1);
    setIsDragging(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragCounter((prev) => {
      const newCounter = prev - 1;
      if (newCounter === 0) {
        setIsDragging(false);
      }
      return newCounter;
    });
  };

  const handleDropzoneClick = () => {
    if (!uploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      if (onError) onError("Please choose a file to upload.");
      return;
    }
    try {
      setUploading(true);
      setUploadProgress(0);
      
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      await uploadFile(selectedFile);
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setTimeout(() => {
        setSelectedFile(null);
        setUploadProgress(0);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        if (onUploadSuccess) {
          onUploadSuccess();
        }
        if (onSuccess) {
          onSuccess(`"${selectedFile.name}" uploaded successfully!`);
        }
      }, 500);
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error.message ||
        "Upload failed. Please try again.";
      setUploadProgress(0);
      if (onError) onError(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setUploadProgress(0);
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

      <div
        ref={dropzoneRef}
        className={`upload-dropzone ${isDragging ? "is-dragging" : ""} ${uploading ? "is-uploading" : ""}`.trim()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onClick={handleDropzoneClick}
        role="button"
        tabIndex={uploading ? -1 : 0}
        aria-label="Upload file by clicking or dragging and dropping"
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !uploading) {
            e.preventDefault();
            handleDropzoneClick();
          }
        }}
      >
        {uploading ? (
          <>
            <div className="upload-icon uploading">
              <svg className="spinner" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.25" />
                <path
                  d="M12 2a10 10 0 0 1 10 10"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div className="upload-text-main">
              Uploading file...
            </div>
            <div className="upload-text-sub">
              Please wait while your file is being uploaded
            </div>
          </>
        ) : isDragging ? (
          <>
            <div className="upload-icon dragging">
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="upload-text-main">
              Drop your file here
            </div>
            <div className="upload-text-sub">
              Release to upload
            </div>
          </>
        ) : (
          <>
            <div className="upload-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 16V5m0 0L8 9m4-4 4 4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M6 15v1.4A2.6 2.6 0 0 0 8.6 19h6.8A2.6 2.6 0 0 0 18 16.4V15"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="upload-text-main">
              Drag &amp; drop a file here, or{" "}
              <span className="upload-browse-link">click to browse</span>
            </div>
            <div className="upload-text-sub">
              Supports all file types · Max size depends on your Cloudinary plan
            </div>
          </>
        )}

        <input
          ref={fileInputRef}
          type="file"
          style={{ display: "none" }}
          onChange={handleFileChange}
          onClick={(e) => (e.target.value = null)}
          disabled={uploading}
        />
      </div>

      {selectedFile && (
        <div className="upload-file-info">
          <div className="upload-file-details">
            <svg className="upload-file-icon" viewBox="0 0 24 24" fill="none">
              <path
                d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path d="M13 2v7h7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <div className="upload-file-text">
              <div className="upload-file-name" title={selectedFile.name}>
                {selectedFile.name}
              </div>
              <div className="upload-file-size">{formatBytes(selectedFile.size)}</div>
            </div>
            {!uploading && (
              <button
                type="button"
                className="upload-file-remove"
                onClick={handleClear}
                aria-label="Remove file"
              >
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M18 6L6 18M6 6l12 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            )}
          </div>
          {uploading && (
            <div className="upload-progress">
              <div className="upload-progress-bar" style={{ width: `${uploadProgress}%` }}></div>
            </div>
          )}
        </div>
      )}

      <div className="upload-actions">
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
          disabled={uploading}
        >
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M12 5v14m-7-7h14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          Choose file
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleUpload}
          disabled={uploading || !selectedFile}
        >
          {uploading ? (
            <>
              <svg className="spinner" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25" />
                <path
                  d="M12 2a10 10 0 0 1 10 10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
              Uploading…
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 16V5m0 0L8 9m4-4 4 4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M6 15v1.4A2.6 2.6 0 0 0 8.6 19h6.8A2.6 2.6 0 0 0 18 16.4V15"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Upload
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default FileUpload;
