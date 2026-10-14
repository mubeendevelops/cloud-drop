// Keep in sync with MAX_FILE_SIZE_BYTES in server/middleware/uploadMiddleware.js
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const MAX_FILE_SIZE_LABEL = "10 MB";

export const formatBytes = (bytes) => {
  if (!bytes && bytes !== 0) return "";
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
};

export const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  // Compare calendar days (local midnight) rather than dividing raw milliseconds.
  // The ms-division approach floors 47 elapsed hours to 1 "day", showing "1 day ago"
  // for a file uploaded 2 calendar days ago — mismatching the stored createdAt date.
  // Math.round absorbs DST days that are 23 or 25 hours long.
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfFileDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((startOfToday - startOfFileDay) / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  return date.toLocaleDateString();
};

const ARCHIVE_MIME_HINTS = ["zip", "rar", "7z", "tar", "compressed", "archive"];
const ARCHIVE_EXTENSIONS = ["zip", "rar", "7z", "tar", "gz", "tgz", "bz2", "xz"];

// fileName is optional: browsers send no useful type for some formats (rar,
// 7z), so the extension is used when the MIME type says nothing.
export const getFileIcon = (mimeType, fileName = "") => {
  const type = (mimeType || "").toLowerCase();
  const extension = fileName.includes(".")
    ? fileName.split(".").pop().toLowerCase()
    : "";

  if (type.startsWith("image/")) return "image";
  if (type.startsWith("video/")) return "video";
  if (type.startsWith("audio/")) return "audio";
  if (type.includes("pdf")) return "pdf";
  // Spreadsheets and presentations first: every Office and OpenDocument type
  // also contains the word "document".
  if (type.includes("excel") || type.includes("spreadsheet")) return "spreadsheet";
  if (type.includes("powerpoint") || type.includes("presentation")) return "presentation";
  if (type.includes("word") || type.includes("document")) return "document";
  if (
    ARCHIVE_MIME_HINTS.some((hint) => type.includes(hint)) ||
    ARCHIVE_EXTENSIONS.includes(extension)
  ) {
    return "archive";
  }
  if (type.includes("text") || type.includes("code")) return "text";

  return "file";
};

// Small square Cloudinary rendition for list previews. Returns the original
// URL when it is not a Cloudinary image URL.
export const getThumbnailUrl = (url, size = 96) => {
  if (!url || !url.includes("/image/upload/")) return url;
  return url.replace(
    "/image/upload/",
    `/image/upload/c_fill,w_${size},h_${size},f_auto,q_auto/`
  );
};

export const isImageFile = (mimeType) => {
  return mimeType && mimeType.startsWith("image/");
};

// Cloudinary URL that is served with "Content-Disposition: attachment".
// Cloudinary only accepts a plain name in the flag (no dots, slashes, or
// non-ASCII characters) and appends the extension itself.
export const getDownloadUrl = (file) => {
  const url = file?.cloudinaryUrl || "";
  if (!url.includes("/upload/")) return url;
  const baseName = (file.originalName || "").replace(/\.[^.]*$/, "");
  const safeName = baseName
    .replace(/[^A-Za-z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "");
  const flag = safeName ? `fl_attachment:${safeName}` : "fl_attachment";
  return url.replace("/upload/", `/upload/${flag}/`);
};

// Fetch the file and hand it to the browser under its exact original name.
// Resolves false when that is not possible so the caller can fall back to
// getDownloadUrl.
export const saveFileAs = async (url, fileName) => {
  try {
    const response = await fetch(url);
    if (!response.ok) return false;
    const objectUrl = URL.createObjectURL(await response.blob());
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    return true;
  } catch {
    return false;
  }
};

export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand("copy");
      document.body.removeChild(textArea);
      return true;
    } catch {
      document.body.removeChild(textArea);
      return false;
    }
  }
};

