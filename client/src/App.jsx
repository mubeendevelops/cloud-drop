import React, { useEffect, useState } from "react";
import FileUpload from "./components/FileUpload.jsx";
import FileList from "./components/FileList.jsx";
import { getFiles, deleteFile } from "./services/api.js";

const App = () => {
  const [files, setFiles] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState("");

  const fetchFiles = async () => {
    try {
      setListError("");
      setListLoading(true);
      const data = await getFiles();
      setFiles(data);
    } catch (error) {
      setListError(
        error?.response?.data?.message ||
          error.message ||
          "Failed to fetch files"
      );
    } finally {
      setListLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this file?")) return;
    try {
      await deleteFile(id);
      setFiles((prev) => prev.filter((file) => file._id !== id));
    } catch (error) {
      alert(
        error?.response?.data?.message ||
          error.message ||
          "Failed to delete file"
      );
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  return (
    <div className="app-root">
      <header className="app-header">
        <h1 className="app-title">Cloud Drop</h1>
        <p className="app-subtitle">
          Simple, fast, and secure file uploads powered by Cloudinary & MongoDB.
        </p>
      </header>

      <main className="app-main">
        <section className="card">
          <FileUpload onUploadSuccess={fetchFiles} />
        </section>

        <section className="card">
          <FileList
            files={files}
            loading={listLoading}
            error={listError}
            onDelete={handleDelete}
          />
        </section>
      </main>

      <footer className="app-footer">
        <span>Cloud Drop · Full-stack file upload & download demo</span>
      </footer>
    </div>
  );
};

export default App;
