import React, { useState } from "react";
import {
  formatBytes,
  formatDate,
  getFileIcon,
  isImageFile,
  copyToClipboard,
} from "../utils/fileUtils";

const FileIcon = ({ mimeType }) => {
  const iconType = getFileIcon(mimeType);
  const icons = {
    image: (
      <svg viewBox="0 0 24 24" fill="none">
        <rect
          x="3"
          y="3"
          width="18"
          height="18"
          rx="2"
          stroke="currentColor"
          strokeWidth="2"
        />
        <circle
          cx="8.5"
          cy="8.5"
          r="1.5"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M21 15l-5-5L5 21"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
    video: (
      <svg viewBox="0 0 24 24" fill="none">
        <path
          d="M23 7l-7 5 7 5V7z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <rect
          x="1"
          y="5"
          width="15"
          height="14"
          rx="2"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
    ),
    audio: (
      <svg viewBox="0 0 24 24" fill="none">
        <path
          d="M11 5L6 9H2v6h4l5 4V5z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
    ),
    pdf: (
      <svg viewBox="0 0 24 24" fill="none">
        <path
          d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M14 2v6h6M16 13H8M16 17H8M10 9H8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
    document: (
      <svg viewBox="0 0 24 24" fill="none">
        <path
          d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M14 2v6h6M16 13H8M16 17H8M10 9H8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
    spreadsheet: (
      <svg viewBox="0 0 24 24" fill="none">
        <path
          d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M14 2v6h6M8 13h8M8 17h8M8 9h8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
    archive: (
      <svg viewBox="0 0 24 24" fill="none">
        <path
          d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
    ),
    text: (
      <svg viewBox="0 0 24 24" fill="none">
        <path
          d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M14 2v6h6M16 13H8M16 17H8M10 9H8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
    file: (
      <svg viewBox="0 0 24 24" fill="none">
        <path
          d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M13 2v7h7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  };
  return <span className="file-icon">{icons[iconType] || icons.file}</span>;
};

const FileList = ({ files, loading, error, onDelete, onCopyUrl }) => {
  const [copiedId, setCopiedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const hasFiles = files && files.length > 0;

  const filteredFiles = hasFiles
    ? files.filter((file) =>
        file.originalName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleCopyUrl = async (file) => {
    const success = await copyToClipboard(file.cloudinaryUrl);
    if (success) {
      setCopiedId(file._id);
      setTimeout(() => setCopiedId(null), 2000);
      if (onCopyUrl) onCopyUrl();
    }
  };

  return (
    <div>
      <div className="list-header">
        <div>
          <h2 className="list-title">Your files</h2>
          <div className="list-subtitle">
            Browse, download, or delete uploaded files.
          </div>
        </div>
        <span className="list-count">
          {hasFiles
            ? `${files.length} item${files.length !== 1 ? "s" : ""}`
            : "No files yet"}
        </span>
      </div>

      {hasFiles && (
        <div className="search-container">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none">
            <circle
              cx="11"
              cy="11"
              r="8"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="m21 21-4.35-4.35"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="search-clear"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
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
      )}

      {error && (
        <div className="alert alert-error">
          <svg viewBox="0 0 24 24" fill="none">
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M12 8v4M12 16h.01"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          {error}
        </div>
      )}

      {loading && (
        <div className="loading-skeleton-container">
          {[1, 2, 3].map((i) => (
            <div key={i} className="file-row-skeleton">
              <div className="skeleton-icon"></div>
              <div className="skeleton-content">
                <div className="skeleton-line skeleton-title"></div>
                <div className="skeleton-line skeleton-meta"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && !hasFiles && !error && (
        <div className="list-empty">
          <svg className="empty-icon" viewBox="0 0 24 24" fill="none">
            <path
              d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M14 2v6h6M16 13H8M16 17H8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <p>Nothing here yet.</p>
          <p className="empty-subtitle">
            Upload a file to see it appear in your library.
          </p>
        </div>
      )}

      {!loading && searchQuery && filteredFiles.length === 0 && (
        <div className="list-empty">
          <p>No files found matching "{searchQuery}"</p>
        </div>
      )}

      {!loading && hasFiles && (
        <div className="file-list">
          {(searchQuery ? filteredFiles : files).map((file) => (
            <div key={file._id} className="file-row">
              <div className="file-icon-wrapper">
                {isImageFile(file.mimeType) ? (
                  <div className="file-preview">
                    <img
                      src={file.cloudinaryUrl}
                      alt={file.originalName}
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <FileIcon mimeType={file.mimeType} />
                )}
              </div>
              <div className="file-main">
                <div className="file-name" title={file.originalName}>
                  {file.originalName}
                </div>
                <div className="file-meta">
                  <span>{formatBytes(file.size)}</span>
                  <span>·</span>
                  <span>{file.mimeType || "Unknown"}</span>
                  <span>·</span>
                  <span className="file-date">
                    {formatDate(file.createdAt)}
                  </span>
                </div>
              </div>
              <div className="file-actions">
                <button
                  className="btn-icon"
                  onClick={() => handleCopyUrl(file)}
                  title="Copy URL"
                  aria-label="Copy URL"
                >
                  {copiedId === file._id ? (
                    <svg viewBox="0 0 24 24" fill="none">
                      <path
                        d="M20 6L9 17l-5-5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none">
                      <rect
                        x="9"
                        y="9"
                        width="13"
                        height="13"
                        rx="2"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <path
                        d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                    </svg>
                  )}
                </button>
                <a
                  className="btn-icon btn-icon-primary"
                  href={file.cloudinaryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Download"
                  aria-label="Download"
                >
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </a>
                <button
                  type="button"
                  className="btn-icon btn-icon-danger"
                  onClick={() => onDelete(file._id, file.originalName)}
                  title="Delete"
                  aria-label="Delete"
                >
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileList;
