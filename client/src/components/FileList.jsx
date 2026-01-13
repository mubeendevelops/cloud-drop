import React from "react";

const formatBytes = (bytes) => {
  if (!bytes && bytes !== 0) return "";
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
};

const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleString();
};

const FileList = ({ files, loading, error, onDelete }) => {
  const hasFiles = files && files.length > 0;

  return (
    <div>
      <div className="list-header">
        <div>
          <h2 className="list-title">Your files</h2>
          <div
            style={{
              fontSize: "0.8rem",
              color: "#9ca3af",
              marginTop: 4,
            }}
          >
            Browse, download, or delete uploaded files.
          </div>
        </div>
        <span className="list-count">
          {hasFiles
            ? `${files.length} item${files.length !== 1 ? "s" : ""}`
            : "No files yet"}
        </span>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: 10 }}>
          {error}
        </div>
      )}

      {loading && (
        <div className="alert alert-info" style={{ marginBottom: 10 }}>
          Loading files…
        </div>
      )}

      {!loading && !hasFiles && !error && (
        <div className="list-empty">
          Nothing here yet. Upload a file to see it appear in your library.
        </div>
      )}

      {hasFiles && (
        <div className="file-list">
          {files.map((file) => (
            <div key={file._id} className="file-row">
              <div className="file-main">
                <div className="file-name" title={file.originalName}>
                  {file.originalName}
                </div>
                <div className="file-meta">
                  <span>{formatBytes(file.size)}</span>
                  <span>·</span>
                  <span>{file.mimeType}</span>
                </div>
              </div>
              <div
                style={{
                  fontSize: "0.76rem",
                  color: "#9ca3af",
                }}
              >
                <div>Uploaded</div>
                <div>{formatDate(file.createdAt)}</div>
              </div>
              <div className="file-actions">
                <a
                  className="btn-ghost btn-ghost-primary"
                  href={file.cloudinaryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span>Download</span>
                </a>
                <button
                  type="button"
                  className="btn-ghost btn-ghost-danger"
                  onClick={() => onDelete(file._id)}
                >
                  Delete
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
