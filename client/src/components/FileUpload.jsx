import React, { useEffect, useRef, useState } from "react";
import { uploadFile, getErrorMessage, isUnauthorized } from "../services/api.js";
import {
  formatBytes,
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_LABEL,
} from "../utils/fileUtils";

// Share of the progress bar given to sending the request body
const UPLOAD_SENT_PERCENT = 95;
const COMPLETED_BAR_MS = 700;

const FileUpload = ({ onUploadSuccess, onError, onSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const fileInputRef = useRef(null);
  // Guards against a second click before the "uploading" render has happened
  const uploadingRef = useRef(false);
  const resetTimerRef = useRef(null);

  useEffect(() => {
    return () => clearTimeout(resetTimerRef.current);
  }, []);

  const selectFile = (file) => {
    if (!file) return;
    if (file.size > MAX_FILE_SIZE_BYTES) {
      if (onError) {
        onError(
          `"${file.name}" is ${formatBytes(file.size)}. The limit is ${MAX_FILE_SIZE_LABEL} per file.`
        );
      }
      return;
    }
    setSelectedFile(file);
    setUploadProgress(0);
  };

  const handleFileChange = (event) => {
    selectFile(event.target.files?.[0]);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    setDragCounter(0);
    if (uploading) return;

    selectFile(event.dataTransfer.files?.[0]);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isDragging && !uploading) {
      setIsDragging(true);
    }
  };

  const handleDragEnter = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragCounter((prev) => prev + 1);
    if (!uploading) setIsDragging(true);
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
    if (uploadingRef.current) return;
    uploadingRef.current = true;
    try {
      setUploading(true);
      setUploadProgress(0);

      // The bar tracks bytes sent to the API. The last few percent are held
      // back until the server has stored the file and answered.
      await uploadFile(selectedFile, (fraction) => {
        setUploadProgress(Math.round(fraction * UPLOAD_SENT_PERCENT));
      });
      setUploadProgress(100);

      if (onUploadSuccess) {
        onUploadSuccess();
      }
      if (onSuccess) {
        onSuccess(`"${selectedFile.name}" uploaded successfully!`);
      }

      // Show the completed bar briefly. The controls stay disabled until the
      // selection is cleared, so the same file cannot be sent twice.
      resetTimerRef.current = setTimeout(() => {
        setSelectedFile(null);
        setUploadProgress(0);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        uploadingRef.current = false;
        setUploading(false);
      }, COMPLETED_BAR_MS);
    } catch (error) {
      uploadingRef.current = false;
      setUploading(false);
      setUploadProgress(0);
      // A 401 ends the session; AuthContext reports it
      if (onError && !isUnauthorized(error)) {
        onError(getErrorMessage(error, "Upload failed. Please try again."));
      }
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
              {uploadProgress >= 100
                ? "Upload complete"
                : `Uploading file... ${uploadProgress}%`}
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
              Supports all file types · Max {MAX_FILE_SIZE_LABEL} per file
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
            <div
              className="upload-progress"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={uploadProgress}
            >
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
