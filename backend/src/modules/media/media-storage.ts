import {
  deleteImage,
  uploadImageBuffer,
} from "../../infrastructure/storage/cloudinary-storage.js";

export type MediaStorage = {
  deleteImage: typeof deleteImage;
  uploadImageBuffer: typeof uploadImageBuffer;
};

export const cloudinaryMediaStorage: MediaStorage = {
  deleteImage,
  uploadImageBuffer,
};
