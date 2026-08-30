import { conflictError as sharedConflictError, httpError } from "../../shared/errors/index.js";
import { CatalogPersistenceConflictError } from "./catalog.persistence-errors.js";

export function catalogHttpError(
  statusCode: number,
  code: string,
  message: string,
  details?: unknown,
): Error {
  return httpError(statusCode, code, message, details);
}

export function notFoundError(resource: string): Error {
  return catalogHttpError(404, "CATALOG_NOT_FOUND", `${resource} not found`);
}

export function conflictError(message: string): Error {
  return sharedConflictError("CATALOG_CONFLICT", message);
}

export function throwCatalogPersistenceError(error: unknown): never {
  if (!(error instanceof CatalogPersistenceConflictError)) {
    throw error;
  }

  switch (error.kind) {
    case "category_cycle":
      throw conflictError("Category parent relationship would create a cycle");
    case "category_hierarchy":
      throw conflictError("The category hierarchy changed; reload and try again");
    case "media_attachment":
      throw conflictError("One or more media assets changed before the catalog item was saved");
    case "unique_constraint":
      throw conflictError("A catalog value or media asset is already in use");
    case "concurrent_update":
      throw conflictError("The catalog item changed concurrently; reload and try again");
  }
}
