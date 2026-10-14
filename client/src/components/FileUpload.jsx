import { useEffect, useRef, useState } from "react";
import { uploadFile, getErrorMessage, isUnauthorized } from "../services/api.js";
import {
  formatBytes,
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_LABEL,
} from "../utils/fileUtils";
import Button from "./ui/Button.jsx";
import IconButton from "./ui/IconButton.jsx";
import Spinner from "./ui/Spinner.jsx";

// Share of the progress bar given to sending the request body
const UPLOAD_SENT_PERCENT = 95;
const COMPLETED_BAR_MS = 700;

const FileUpload = ({ onUploadSuccess, onError, onSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [, setDragCounter] = useState(0);
  // Shown in the dropzone; the toast from onError still reports it as well
  const [dropError, setDropError] = useState("");
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
      const message = `This file is over ${MAX_FILE_SIZE_LABEL}. Please choose a smaller one.`;
      setDropError(message);
      if (onError) onError(message);
      return;
    }
    setDropError("");
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
        onSuccess(`"${selectedFile.name}" uploaded.`);
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
      if (!isUnauthorized(error)) setDropError("Couldn't upload this file. Please try again.");
      if (onError && !isUnauthorized(error)) {
        onError(getErrorMessage(error, "Couldn't upload this file. Please try again."));
      }
    }
  };

  const handleClear = () => {
    setDropError("");
    setSelectedFile(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const dropzoneState = uploading
    ? "is-uploading"
    : isDragging
    ? "is-dragging"
    : dropError
    ? "is-error"
    : "";

  return (
    <div className="upload">
      <div className="section-header">
        <div>
          <h2 className="section-title" id="upload-title">
            Upload a file
          </h2>
          <p className="section-subtitle">
            Any file type, securely stored.
          </p>
        </div>
        <span className="tag">Max {MAX_FILE_SIZE_LABEL}</span>
      </div>

      <div
        className={`upload-dropzone ${dropzoneState}`.trim()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onClick={handleDropzoneClick}
        role="button"
        tabIndex={uploading ? -1 : 0}
        aria-label="Upload file by clicking or dragging and dropping"
        aria-disabled={uploading || undefined}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !uploading) {
            e.preventDefault();
            handleDropzoneClick();
          }
        }}
      >
        <div className="upload-icon" aria-hidden="true">
          {uploading ? (
            <Spinner />
          ) : dropError && !isDragging ? (
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
              <path d="M12 7.5v5.5M12 16.5h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          ) : (
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
          )}
        </div>

        {uploading ? (
          <>
            <div className="upload-text-main">
              {uploadProgress >= 100
                ? "Upload complete"
                : <>Uploading… <span className="tnum">{uploadProgress}%</span></>}
            </div>
            <div className="upload-text-sub">
              Please wait while your file is being uploaded
            </div>
          </>
        ) : isDragging ? (
          <>
            <div className="upload-text-main">Drop your file here</div>
            <div className="upload-text-sub">Release to upload</div>
          </>
        ) : dropError ? (
          <>
            <div className="upload-text-main">{dropError}</div>
            <div className="upload-text-sub">
              Drop another file here, or{" "}
              <span className="upload-browse-link">browse</span>
            </div>
          </>
        ) : (
          <>
            <div className="upload-text-main">
              Drag &amp; drop a file here, or{" "}
              <span className="upload-browse-link">browse</span>
            </div>
            <div className="upload-text-sub">
              Max {MAX_FILE_SIZE_LABEL} per file
            </div>
          </>
        )}

        <input
          ref={fileInputRef}
          type="file"
          hidden
          tabIndex={-1}
          onChange={handleFileChange}
          onClick={(e) => (e.target.value = null)}
          disabled={uploading}
        />
      </div>

      {selectedFile && (
        <div className="upload-file">
          <div className="upload-file-row">
            <span className="file-tile" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path d="M13 2v7h7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
            <div className="upload-file-text">
              <div className="upload-file-name" title={selectedFile.name}>
                {selectedFile.name}
              </div>
              <div className="upload-file-size tnum">
                {formatBytes(selectedFile.size)}
                {uploading && ` · ${uploadProgress}%`}
              </div>
            </div>
            {!uploading && (
              <IconButton label="Remove file" onClick={handleClear}>
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M18 6L6 18M6 6l12 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </IconButton>
            )}
          </div>
          {uploading && (
            <div
              className="progress"
              role="progressbar"
              aria-label="Upload progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={uploadProgress}
            >
              <div
                className={`progress-bar ${uploadProgress >= 100 ? "is-complete" : ""}`.trim()}
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          )}
        </div>
      )}

      <div className="upload-actions">
        <Button
          variant="secondary"
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
          disabled={uploading}
          icon={
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 5v14m-7-7h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          }
        >
          Choose file
        </Button>
        <Button
          onClick={handleUpload}
          disabled={!selectedFile}
          loading={uploading}
          loadingText="Uploading…"
          icon={
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
          }
        >
          Upload
        </Button>
      </div>
    </div>
  );
};

export default FileUpload;
