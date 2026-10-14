import axios from "axios";

const REQUEST_TIMEOUT_MS = 20000;
// Uploads go through the API to Cloudinary, so they need far longer
const UPLOAD_TIMEOUT_MS = 5 * 60 * 1000;

export const SERVER_UNREACHABLE_MESSAGE =
  "The server is not responding. It may be waking up; try again in a minute.";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  timeout: REQUEST_TIMEOUT_MS,
});

// True when the request never got an answer (timeout, offline, server down)
export const isNetworkError = (error) =>
  axios.isAxiosError(error) && !error.response;

export const isUnauthorized = (error) => error?.response?.status === 401;

export const getErrorMessage = (error, fallbackMessage) => {
  if (isNetworkError(error)) return SERVER_UNREACHABLE_MESSAGE;
  return error?.response?.data?.message || error?.message || fallbackMessage;
};

// AuthContext registers a callback here so an expired session can reset auth
// state without a second Axios instance or a page reload.
let unauthorizedHandler = null;

export const setUnauthorizedHandler = (handler) => {
  unauthorizedHandler = handler;
};

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
    const requestUrl = error?.config?.url || "";
    const isAuthRoute =
      requestUrl.includes("/api/auth/login") ||
      requestUrl.includes("/api/auth/register");
    const sentToken = error?.config?.headers?.Authorization;
    const currentToken = localStorage.getItem("token");
    // Ignore answers to requests sent with a token that has since been replaced
    const isCurrentSession =
      !!currentToken && sentToken === `Bearer ${currentToken}`;

    if (isUnauthorized(error) && isCurrentSession && !isAuthRoute) {
      // Token expired or invalid for an authenticated request
      localStorage.removeItem("token");
      if (unauthorizedHandler) unauthorizedHandler();
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
// onProgress, when given, is called with the fraction (0 to 1) of the request
// body sent so far
export const uploadFile = async (file, onProgress) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiClient.post("/api/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    timeout: UPLOAD_TIMEOUT_MS,
    onUploadProgress: (event) => {
      if (onProgress && event.total) {
        onProgress(event.loaded / event.total);
      }
    },
  });

  return response.data;
};

export const getFiles = async () => {
  const response = await apiClient.get("/api/files");
  return response.data;
};

export const deleteFile = async (id) => {
  const response = await apiClient.delete(`/api/files/${id}`);
  return response.data;
};
