import multer from "multer";
import type { RequestHandler } from "express";
import { MAX_PRODUCT_IMAGES } from "@cartura/contracts/catalog";

import { validationError } from "../../shared/errors/index.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: MAX_PRODUCT_IMAGES,
  },
});

export const handleMediaImageUpload: RequestHandler = (req, res, next) => {
  upload.array("files", MAX_PRODUCT_IMAGES)(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError) {
      next(validationError({
        code: error.code,
        field: error.field,
        message: error.message,
      }));
      return;
    }

    next(error);
  });
};
