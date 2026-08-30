import { StorageNotConfiguredError } from "../../infrastructure/storage/storage.errors.js";
import { httpError } from "../../shared/errors/index.js";

export function throwMediaStorageError(error: unknown): never {
  if (error instanceof StorageNotConfiguredError) {
    throw httpError(
      503,
      "MEDIA_STORAGE_UNAVAILABLE",
      "Media storage is not configured",
    );
  }

  throw error;
}
