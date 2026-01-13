import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
dotenv.config();

const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
  process.env;

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.warn(
    "Cloudinary environment variables are not fully set. Uploads will fail until configured."
  );
}

// console.log("CLOUDINARY_CLOUD_NAME: ", CLOUDINARY_CLOUD_NAME);
// console.log("CLOUDINARY_API_KEY: ", CLOUDINARY_API_KEY);
// console.log("CLOUDINARY_API_SECRET: ", CLOUDINARY_API_SECRET);

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
  secure: true,
});

export default cloudinary;
