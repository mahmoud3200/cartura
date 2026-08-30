import { v2 as cloudinary } from "cloudinary";

import { env } from "../../config/env.js";
import { StorageNotConfiguredError } from "./storage.errors.js";

let configured = false;

export function getCloudinaryClient() {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw new StorageNotConfiguredError("Cloudinary");
  }

  if (!configured) {
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    configured = true;
  }

  return cloudinary;
}
