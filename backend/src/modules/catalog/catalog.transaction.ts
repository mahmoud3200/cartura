import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../infrastructure/database/prisma.js";
import { CatalogPersistenceConflictError } from "./catalog.persistence-errors.js";

const MAX_SERIALIZABLE_ATTEMPTS = 3;

export async function runCatalogTransaction<T>(
  operation: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  for (let attempt = 1; attempt <= MAX_SERIALIZABLE_ATTEMPTS; attempt += 1) {
    try {
      return await prisma.$transaction(operation, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      if (
        hasPrismaErrorCode(error, "P2034") &&
        attempt < MAX_SERIALIZABLE_ATTEMPTS
      ) {
        continue;
      }

      if (hasPrismaErrorCode(error, "P2034")) {
        throw new CatalogPersistenceConflictError("concurrent_update");
      }

      throw error;
    }
  }

  throw new CatalogPersistenceConflictError("concurrent_update");
}

export function translateCatalogConstraintError(error: unknown): never {
  if (hasPrismaErrorCode(error, "P2002")) {
    throw new CatalogPersistenceConflictError("unique_constraint");
  }

  if (
    hasPrismaErrorCode(error, "P2003") ||
    hasPrismaErrorCode(error, "P2025")
  ) {
    throw new CatalogPersistenceConflictError("concurrent_update");
  }

  throw error;
}

function hasPrismaErrorCode(error: unknown, code: string): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === code,
  );
}
