import { useState } from "react";
import {
  formatBytes,
  formatDate,
  getFileIcon,
  isImageFile,
  copyToClipboard,
  getDownloadUrl,
  getThumbnailUrl,
  saveFileAs,
} from "../utils/fileUtils";
import Alert from "./ui/Alert.jsx";
import Button from "./ui/Button.jsx";
import IconButton from "./ui/IconButton.jsx";
import Input from "./ui/Input.jsx";
import Spinner from "./ui/Spinner.jsx";

const FileIcon = ({ mimeType, fileName }) => {
  const iconType = getFileIcon(mimeType, fileName);
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
    presentation: (
      <svg viewBox="0 0 24 24" fill="none">
        <rect
          x="3"
          y="4"
          width="18"
          height="12"
          rx="2"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M12 16v4M8 20h8M2 4h20"
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
  return (
    <span className={`file-tile file-tile-${icons[iconType] ? iconType : "file"}`} aria-hidden="true">
      {icons[iconType] || icons.file}
    </span>
  );
};

const FileList = ({ files, loading, error, onRetry, onDelete, onCopyUrl }) => {
  const [copiedId, setCopiedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [downloadingId, setDownloadingId] = useState(null);
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

  const handleDownload = async (event, file) => {
    event.preventDefault();
    if (downloadingId) return;
    setDownloadingId(file._id);
    const saved = await saveFileAs(file.cloudinaryUrl, file.originalName);
    setDownloadingId(null);
    // Fall back to Cloudinary's attachment URL (simplified file name)
    if (!saved) window.location.assign(getDownloadUrl(file));
  };

  const visibleFiles = searchQuery ? filteredFiles : files;

  return (
    <div className="files">
      <div className="section-header">
        <div>
          <h2 className="section-title" id="files-title">
            Your files
          </h2>
          <p className="section-subtitle">
            Browse, download, or delete your files.
          </p>
        </div>
        {hasFiles && (
          <span className="list-count tnum" aria-live="polite">
            {searchQuery
              ? `${filteredFiles.length} of ${files.length} file${files.length !== 1 ? "s" : ""}`
              : `${files.length} file${files.length !== 1 ? "s" : ""}`}
          </span>
        )}
      </div>

      {hasFiles && (
        <Input
          id="file-search"
          type="search"
          label="Search files"
          hideLabel
          className="file-search"
          placeholder="Search files…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leading={
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="7.5" stroke="currentColor" strokeWidth="2" />
              <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          }
          trailing={
            searchQuery && (
              <button
                type="button"
                className="field-trailing-btn"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            )
          }
        />
      )}

      {error && (
        <Alert
          action={
            onRetry &&
            !loading && (
              <Button variant="secondary" size="sm" onClick={onRetry}>
                Retry
              </Button>
            )
          }
        >
          {error}
        </Alert>
      )}

      {loading && (
        <div className="file-list" aria-busy="true" aria-label="Loading files">
          {[1, 2, 3].map((i) => (
            <div key={i} className="file-row file-row-skeleton" aria-hidden="true">
              <div className="skeleton skeleton-tile"></div>
              <div className="skeleton-lines">
                <div className="skeleton skeleton-title"></div>
                <div className="skeleton skeleton-meta"></div>
              </div>
            </div>
          ))}
          <span className="visually-hidden" role="status">
            Loading files…
          </span>
        </div>
      )}

      {!loading && !hasFiles && !error && (
        <div className="empty-state">
          <span className="empty-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M7 18.5h10.5a4 4 0 0 0 .6-7.96A6 6 0 0 0 6.5 9.6 4.5 4.5 0 0 0 7 18.5z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <path
                d="M12 16v-5m0 0-2 2m2-2 2 2"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <p className="empty-title">Your library is empty</p>
          <p className="empty-subtitle">
            Upload your first file and it'll show up here.
          </p>
        </div>
      )}

      {!loading && searchQuery && filteredFiles.length === 0 && (
        <div className="empty-state empty-state-compact">
          <p className="empty-title">No files found matching "{searchQuery}"</p>
          <Button variant="ghost" size="sm" onClick={() => setSearchQuery("")}>
            Clear search
          </Button>
        </div>
      )}

      {!loading && hasFiles && visibleFiles.length > 0 && (
        <ul className="file-list">
          {visibleFiles.map((file) => (
            <li key={file._id} className="file-row">
              {isImageFile(file.mimeType) ? (
                <span className="file-tile file-tile-preview">
                  <img
                    src={getThumbnailUrl(file.cloudinaryUrl)}
                    alt=""
                    loading="lazy"
                  />
                </span>
              ) : (
                <FileIcon
                  mimeType={file.mimeType}
                  fileName={file.originalName}
                />
              )}
              <div className="file-main">
                <div className="file-name" title={file.originalName}>
                  {file.originalName}
                </div>
                <div className="file-meta">
                  <span className="tnum">{formatBytes(file.size)}</span>
                  <span aria-hidden="true">·</span>
                  <span className="file-type">{file.mimeType || "Unknown"}</span>
                  <span aria-hidden="true">·</span>
                  <span className="file-date tnum">
                    {formatDate(file.createdAt)}
                  </span>
                </div>
              </div>
              <div className="file-actions">
                <IconButton
                  label={copiedId === file._id ? "Copied" : `Copy URL of ${file.originalName}`}
                  className={copiedId === file._id ? "is-done" : undefined}
                  onClick={() => handleCopyUrl(file)}
                >
                  {copiedId === file._id ? (
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="M20 6L9 17l-5-5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
                </IconButton>
                <IconButton
                  tone="primary"
                  label={`Download ${file.originalName}`}
                  href={getDownloadUrl(file)}
                  download={file.originalName}
                  rel="noopener noreferrer"
                  onClick={(event) => handleDownload(event, file)}
                  aria-busy={downloadingId === file._id}
                >
                  {downloadingId === file._id ? (
                    <Spinner />
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </IconButton>
                <IconButton
                  tone="danger"
                  label={`Delete ${file.originalName}`}
                  onClick={() => onDelete(file._id, file.originalName)}
                >
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </IconButton>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FileList;
