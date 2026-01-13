import React, { useEffect, useState } from "react";
import FileUpload from "./components/FileUpload.jsx";
import FileList from "./components/FileList.jsx";
import ToastContainer from "./components/ToastContainer.jsx";
import Modal from "./components/Modal.jsx";
import SignIn from "./components/SignIn.jsx";
import SignUp from "./components/SignUp.jsx";
import { getFiles, deleteFile } from "./services/api.js";
import { useToast } from "./hooks/useToast.js";
import { useAuth } from "./contexts/AuthContext.jsx";

const App = () => {
  const [authMode, setAuthMode] = useState("signin"); // "signin" or "signup"
  const { user, loading, signOut, isAuthenticated } = useAuth();
  const [files, setFiles] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState("");
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    fileId: null,
    fileName: "",
  });
  const { toasts, removeToast, success, error, info } = useToast();

  const fetchFiles = async () => {
    try {
      setListError("");
      setListLoading(true);
      const data = await getFiles();
      setFiles(data);
    } catch (err) {
      const errorMsg =
        err?.response?.data?.message || err.message || "Failed to fetch files";
      setListError(errorMsg);
      error(errorMsg);
    } finally {
      setListLoading(false);
    }
  };

  const handleDeleteClick = (id, fileName) => {
    setDeleteModal({ isOpen: true, fileId: id, fileName });
  };

  const handleDeleteConfirm = async () => {
    const { fileId } = deleteModal;
    try {
      await deleteFile(fileId);
      setFiles((prev) => prev.filter((file) => file._id !== fileId));
      success("File deleted successfully");
      setDeleteModal({ isOpen: false, fileId: null, fileName: "" });
    } catch (err) {
      const errorMsg =
        err?.response?.data?.message || err.message || "Failed to delete file";
      error(errorMsg);
    }
  };

  const handleCopyUrl = () => {
    success("URL copied to clipboard!");
  };

  const handleUploadError = (msg) => {
    error(msg);
  };

  const handleUploadSuccess = (msg) => {
    success(msg);
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchFiles();
    }
  }, [isAuthenticated]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="app-root">
        <div className="auth-loading">
          <div className="spinner" style={{ width: "48px", height: "48px" }}>
            <svg viewBox="0 0 24 24">
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                opacity="0.25"
              />
              <path
                d="M12 2a10 10 0 0 1 10 10"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
    );
  }

  // Show authentication forms if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="app-root">
        <header className="app-header">
          <h1 className="app-title">Cloud Drop</h1>
          <p className="app-subtitle">
            A lightweight full-stack application for uploading and managing
            files.
          </p>
        </header>

        <main className="app-main auth-main">
          <section className="card auth-card">
            {authMode === "signin" ? (
              <SignIn onSwitchToSignUp={() => setAuthMode("signup")} />
            ) : (
              <SignUp onSwitchToSignIn={() => setAuthMode("signin")} />
            )}
          </section>
        </main>

        <footer className="app-footer">
          <span>Cloud Drop · Full-stack file upload & download demo</span>
        </footer>

        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
    );
  }

  // Show main app if authenticated
  return (
    <div className="app-root">
      <header className="app-header">
        <div className="header-content">
          <div>
            <h1 className="app-title">Cloud Drop</h1>
            <p className="app-subtitle">
              A lightweight full-stack application for uploading and managing
              files.
            </p>
          </div>
          <div className="header-actions">
            <span className="user-name">{user?.name}</span>
            <button className="btn btn-outline btn-logout" onClick={signOut}>
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        <section className="card">
          <FileUpload
            onUploadSuccess={fetchFiles}
            onError={handleUploadError}
            onSuccess={handleUploadSuccess}
          />
        </section>

        <section className="card">
          <FileList
            files={files}
            loading={listLoading}
            error={listError}
            onDelete={handleDeleteClick}
            onCopyUrl={handleCopyUrl}
          />
        </section>
      </main>

      <footer className="app-footer">
        <span>Cloud Drop · Full-stack file upload & download demo</span>
      </footer>

      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() =>
          setDeleteModal({ isOpen: false, fileId: null, fileName: "" })
        }
        onConfirm={handleDeleteConfirm}
        title="Delete File"
        message={`Are you sure you want to delete "${deleteModal.fileName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default App;
