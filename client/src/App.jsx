import React, { useEffect, useState } from "react";
import FileUpload from "./components/FileUpload.jsx";
import FileList from "./components/FileList.jsx";
import ToastContainer from "./components/ToastContainer.jsx";
import Modal from "./components/Modal.jsx";
import { getFiles, deleteFile } from "./services/api.js";
import { useToast } from "./hooks/useToast.js";

const App = () => {
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
    fetchFiles();
  }, []);

  return (
    <div className="app-root">
      <header className="app-header">
        <h1 className="app-title">Cloud Drop</h1>
        <p className="app-subtitle">
          A lightweight full-stack application for uploading and managing files.
        </p>
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
