import type {
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from "@cartura/contracts/catalog";

import type { Prisma } from "../../../generated/prisma/client.js";
import { auditLogsRepository } from "../../audit-logs/audit-logs.repository.js";
import type { RecordAuditLogInput } from "../../audit-logs/audit-logs.types.js";
import { mediaRepository } from "../../media/media.repository.js";
import { CatalogPersistenceConflictError } from "../catalog.persistence-errors.js";
import {
  runCatalogTransaction,
  translateCatalogConstraintError,
} from "../catalog.transaction.js";
import {
  assertParentDoesNotCreateCycle,
  assertVisibleParentAvailable,
  rebuildAffectedProductCategoryClosures,
} from "./categories-hierarchy.persistence.js";
import {
  categoryInclude,
  resolveLineage,
} from "./categories-query.repository.js";

export class CategoriesMutationRepository {
  async create(
    input: CreateCategoryRequest,
    createdBy?: string,
    audit?: RecordAuditLogInput,
  ) {
    try {
      return await runCatalogTransaction(async (tx) => {
        await assertVisibleParentAvailable(
          tx,
          input.parentCategoryId ?? null,
        );
        const imageAsset = await tx.mediaAsset.findUniqueOrThrow({
          where: { id: input.imageAssetId },
        });
        const category = await tx.category.create({
          data: {
            parentCategoryId: input.parentCategoryId ?? null,
            name: input.name,
            slug: input.slug,
            description: input.description ?? null,
            imageUrl: imageAsset.canonicalUrl,
            imageAssetId: imageAsset.id,
            createdBy: createdBy ?? null,
          },
          include: categoryInclude,
        });

        await attachCategoryImage(tx, imageAsset.id, category.id);
        if (audit) {
          await auditLogsRepository.create(
            { ...audit, resourceId: category.id },
            tx,
          );
        }

        return resolveLineage(tx, category);
      });
    } catch (error) {
      translateCatalogConstraintError(error);
    }
  }

  async update(
    categoryId: string,
    input: UpdateCategoryRequest,
    audit?: RecordAuditLogInput,
  ) {
    try {
      return await runCatalogTransaction(async (tx) => {
        const previous = await tx.category.findUniqueOrThrow({
          where: { id: categoryId },
          select: { imageAssetId: true, parentCategoryId: true },
        });
        const data = await mapCategoryUpdate(tx, input);
        const parentChanged =
          input.parentCategoryId !== undefined &&
          input.parentCategoryId !== previous.parentCategoryId;

        if (parentChanged) {
          const nextParentId = input.parentCategoryId ?? null;
          await assertVisibleParentAvailable(tx, nextParentId);
          await assertParentDoesNotCreateCycle(
            tx,
            categoryId,
            nextParentId,
          );
        }

        const category = await tx.category.update({
          where: { id: categoryId },
          data,
          include: categoryInclude,
        });

        if (input.imageAssetId !== undefined) {
          await attachCategoryImage(tx, input.imageAssetId, category.id);
          if (
            previous.imageAssetId &&
            previous.imageAssetId !== input.imageAssetId
          ) {
            await detachCategoryImage(
              tx,
              previous.imageAssetId,
              category.id,
            );
          }
        }
        if (parentChanged) {
          await rebuildAffectedProductCategoryClosures(tx, categoryId);
        }
        if (audit) {
          await auditLogsRepository.create(audit, tx);
        }

        return resolveLineage(tx, category);
      });
    } catch (error) {
      translateCatalogConstraintError(error);
    }
  }

  async softDelete(categoryId: string, audit?: RecordAuditLogInput) {
    try {
      return await runCatalogTransaction(async (tx) => {
        const category = await tx.category.findUniqueOrThrow({
          where: { id: categoryId },
          select: { imageAssetId: true },
        });
        if (category.imageAssetId) {
          await detachCategoryImage(tx, category.imageAssetId, categoryId);
        }

        await tx.category.update({
          where: { id: categoryId },
          data: {
            isDeleted: true,
            imageAssetId: null,
            imageUrl: null,
          },
        });
        if (audit) {
          await auditLogsRepository.create(audit, tx);
        }
      });
    } catch (error) {
      translateCatalogConstraintError(error);
    }
  }
}

async function mapCategoryUpdate(
  tx: Prisma.TransactionClient,
  input: UpdateCategoryRequest,
): Promise<Prisma.CategoryUncheckedUpdateInput> {
  const data: Prisma.CategoryUncheckedUpdateInput = {};
  if (input.parentCategoryId !== undefined) {
    data.parentCategoryId = input.parentCategoryId;
  }
  if (input.name !== undefined) data.name = input.name;
  if (input.slug !== undefined) data.slug = input.slug;
  if (input.description !== undefined) data.description = input.description;
  if (input.imageAssetId !== undefined) {
    const asset = await tx.mediaAsset.findUniqueOrThrow({
      where: { id: input.imageAssetId },
    });
    data.imageAssetId = asset.id;
    data.imageUrl = asset.canonicalUrl;
  }
  return data;
}

async function attachCategoryImage(
  tx: Prisma.TransactionClient,
  mediaAssetId: string,
  categoryId: string,
): Promise<void> {
  const attachment = await mediaRepository.markAttached(tx, [mediaAssetId], {
    type: "category",
    id: categoryId,
  });
  if (attachment.count !== 1) {
    throw new CatalogPersistenceConflictError("media_attachment");
  }
}

async function detachCategoryImage(
  tx: Prisma.TransactionClient,
  mediaAssetId: string,
  categoryId: string,
): Promise<void> {
  const detachment = await mediaRepository.markPending(tx, [mediaAssetId], {
    type: "category",
    id: categoryId,
  });
  if (detachment.count !== 1) {
    throw new CatalogPersistenceConflictError("media_attachment");
  }
}
