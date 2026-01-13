import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
});

// Request interceptor to add token to all requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("token");
      // Optionally redirect to login
      if (window.location.pathname !== "/") {
        window.location.reload();
      }
    }
    return Promise.reject(error);
  }
);

// Authentication endpoints
export const register = async (email, password, name) => {
  const response = await apiClient.post("/api/auth/register", {
    email,
    password,
    name,
  });
  return response.data;
};

export const login = async (email, password) => {
  const response = await apiClient.post("/api/auth/login", {
    email,
    password,
  });
  return response.data;
};

export const getMe = async () => {
  const response = await apiClient.get("/api/auth/me");
  return response.data;
};

// File endpoints
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
