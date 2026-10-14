import { useCallback, useEffect, useRef, useState } from "react";
import FileUpload from "./components/FileUpload.jsx";
import FileList from "./components/FileList.jsx";
import ToastContainer from "./components/ToastContainer.jsx";
import Modal from "./components/Modal.jsx";
import SignIn from "./components/SignIn.jsx";
import SignUp from "./components/SignUp.jsx";
import AppHeader from "./components/AppHeader.jsx";
import AppFooter from "./components/AppFooter.jsx";
import AuthLayout from "./components/AuthLayout.jsx";
import Alert from "./components/ui/Alert.jsx";
import Button from "./components/ui/Button.jsx";
import Card from "./components/ui/Card.jsx";
import Spinner from "./components/ui/Spinner.jsx";
import {
  getFiles,
  deleteFile,
  getErrorMessage,
  isUnauthorized,
} from "./services/api.js";
import { useToast } from "./hooks/useToast.js";
import { useAuth } from "./contexts/AuthContext.jsx";

const App = () => {
  const [authMode, setAuthMode] = useState("signin"); // "signin" or "signup"
  const {
    user,
    loading,
    signOut,
    isAuthenticated,
    connectionError,
    retryConnection,
    sessionExpired,
    acknowledgeSessionExpired,
  } = useAuth();
  const [files, setFiles] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState("");
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    fileId: null,
    fileName: "",
  });
  const [deleting, setDeleting] = useState(false);
  // Guards against a second confirm click before the disabled render
  const deletingRef = useRef(false);
  const { toasts, removeToast, success, error } = useToast();

  const fetchFiles = useCallback(async () => {
    try {
      setListError("");
      setListLoading(true);
      const data = await getFiles();
      setFiles(data);
    } catch (err) {
      // A 401 ends the session; AuthContext shows the sign-in form instead
      if (isUnauthorized(err)) return;
      const errorMsg = getErrorMessage(err, "Failed to fetch files");
      setListError(errorMsg);
      error(errorMsg);
    } finally {
      setListLoading(false);
    }
  }, [error]);

  const handleDeleteClick = (id, fileName) => {
    setDeleteModal({ isOpen: true, fileId: id, fileName });
  };

  const handleDeleteConfirm = async () => {
    const { fileId } = deleteModal;
    if (deletingRef.current) return;
    deletingRef.current = true;
    setDeleting(true);
    try {
      await deleteFile(fileId);
      setFiles((prev) => prev.filter((file) => file._id !== fileId));
      success("File deleted successfully");
      setDeleteModal({ isOpen: false, fileId: null, fileName: "" });
    } catch (err) {
      if (isUnauthorized(err)) return;
      error(getErrorMessage(err, "Failed to delete file"));
    } finally {
      deletingRef.current = false;
      setDeleting(false);
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

  // Loading and clearing the list is what this effect is for, so the
  // synchronous setState calls are intended
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (isAuthenticated) {
      fetchFiles();
    } else {
      // Do not carry one session's files or dialogs into the next
      setFiles([]);
      setListError("");
      setDeleteModal({ isOpen: false, fileId: null, fileName: "" });
    }
  }, [isAuthenticated, fetchFiles]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (sessionExpired) {
      error("Your session has expired. Please sign in again.");
      acknowledgeSessionExpired();
    }
  }, [sessionExpired, error, acknowledgeSessionExpired]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="page page-loading">
        <div className="app-loading" role="status">
          <Spinner size={36} />
          <span>Loading Cloud Drop…</span>
        </div>
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
    );
  }

  // A stored session could not be checked because the server did not answer
  if (connectionError) {
    return (
      <>
        <AuthLayout>
          <div className="auth-header">
            <h1 className="auth-title">Can't reach the server</h1>
          </div>
          <Alert>{connectionError}</Alert>
          <div className="connection-error-actions">
            <Button onClick={retryConnection}>Try again</Button>
            <Button variant="secondary" onClick={signOut}>
              Sign out
            </Button>
          </div>
        </AuthLayout>
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </>
    );
  }

  // Show authentication forms if not authenticated
  if (!isAuthenticated) {
    return (
      <>
        <AuthLayout>
          {authMode === "signin" ? (
            <SignIn
              onSwitchToSignUp={() => setAuthMode("signup")}
              onSuccess={success}
            />
          ) : (
            <SignUp
              onSwitchToSignIn={() => setAuthMode("signin")}
              onSuccess={success}
            />
          )}
        </AuthLayout>
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </>
    );
  }

  // Show main app if authenticated
  return (
    <div className="page page-app">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <AppHeader user={user} onSignOut={signOut} />

      <main className="app-main" id="main" tabIndex={-1}>
        <div className="page-intro">
          <h1 className="page-title">Files</h1>
          <p className="page-subtitle">
            Upload, organize, and download your files from anywhere.
          </p>
        </div>

        <div className="app-grid">
          <Card className="card-upload" aria-labelledby="upload-title">
            <FileUpload
              onUploadSuccess={fetchFiles}
              onError={handleUploadError}
              onSuccess={handleUploadSuccess}
            />
          </Card>

          <Card className="card-files" aria-labelledby="files-title">
            <FileList
              files={files}
              loading={listLoading}
              error={listError}
              onRetry={fetchFiles}
              onDelete={handleDeleteClick}
              onCopyUrl={handleCopyUrl}
            />
          </Card>
        </div>
      </main>

      <AppFooter />

      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() =>
          setDeleteModal({ isOpen: false, fileId: null, fileName: "" })
        }
        onConfirm={handleDeleteConfirm}
        title="Delete file"
        message={`Are you sure you want to delete "${deleteModal.fileName}"? This action cannot be undone.`}
        confirmText="Delete"
        loadingText="Deleting…"
        loading={deleting}
        cancelText="Cancel"
        type="danger"
      />

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default App;
