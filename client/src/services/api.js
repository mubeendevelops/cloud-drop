import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
});

export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiClient.post("/api/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

export const getFiles = async () => {
  const response = await apiClient.get("/api/files");
  return response.data;
};

export const getFileById = async (id) => {
  const response = await apiClient.get(`/api/files/${id}`);
  return response.data;
};

export const deleteFile = async (id) => {
  const response = await apiClient.delete(`/api/files/${id}`);
  return response.data;
};
