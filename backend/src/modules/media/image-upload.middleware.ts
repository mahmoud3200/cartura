import multer from "multer";
import type { RequestHandler } from "express";

import { validationError } from "../../shared/errors/index.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 10,
  },
});

export const handleMediaImageUpload: RequestHandler = (req, res, next) => {
  upload.array("files", 10)(req, res, (error) => {
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
