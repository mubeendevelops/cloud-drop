const REQUIRED_ENV_VARS = [
  "MONGODB_URI",
  "JWT_SECRET",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];

export const getMissingEnvVars = () =>
  REQUIRED_ENV_VARS.filter((name) => !process.env[name]?.trim());
