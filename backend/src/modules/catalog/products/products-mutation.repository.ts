import type {
  CreateProductRequest,
  UpdateProductRequest,
} from "@cartura/contracts/catalog";

import type { Prisma } from "../../../generated/prisma/client.js";
import { auditLogsRepository } from "../../audit-logs/audit-logs.repository.js";
import type { RecordAuditLogInput } from "../../audit-logs/audit-logs.types.js";
import {
  runCatalogTransaction,
  translateCatalogConstraintError,
} from "../catalog.transaction.js";
import { resolveCategoryMembershipForWrite } from "./products-category.persistence.js";
import {
  attachProductImages,
  detachProductImages,
  prepareProductImages,
  replaceProductImages,
} from "./products-image.persistence.js";
import { productInclude } from "./products-query.repository.js";

export class ProductsMutationRepository {
  async create(
    input: CreateProductRequest,
    createdBy?: string,
    audit?: RecordAuditLogInput,
  ) {
    try {
      return await runCatalogTransaction(async (tx) => {
        const membership = await resolveCategoryMembershipForWrite(
          tx,
          input.categoryIds,
        );
        const imageData = await prepareProductImages(tx, input.images);
        const directIds = new Set(membership.directIds);
        const product = await tx.product.create({
          data: {
            name: input.name,
            slug: input.slug,
            description: input.description ?? null,
            sku: input.sku,
            price: input.price,
            stockQuantity: input.stockQuantity,
            createdBy: createdBy ?? null,
            categories: {
              create: membership.expandedIds.map((categoryId) => ({
                categoryId,
                isDirect: directIds.has(categoryId),
              })),
            },
            images: { create: imageData },
          },
          include: productInclude,
        });

        await attachProductImages(tx, input.images, product.id);

        if (audit) {
          await auditLogsRepository.create(
            { ...audit, resourceId: product.id },
            tx,
          );
        }

        return product;
      });
    } catch (error) {
      translateCatalogConstraintError(error);
    }
  }

  async update(
    productId: string,
    input: UpdateProductRequest,
    audit?: RecordAuditLogInput,
  ) {
    try {
      return await runCatalogTransaction(async (tx) => {
        const data = mapProductUpdate(input);
        const previousImages =
          input.images === undefined
            ? []
            : await tx.productImage.findMany({
                where: { productId },
                select: { mediaAssetId: true },
              });

        await tx.product.update({ where: { id: productId }, data });

        if (input.categoryIds !== undefined) {
          const membership = await resolveCategoryMembershipForWrite(
            tx,
            input.categoryIds,
          );
          const directIds = new Set(membership.directIds);
          await tx.productCategory.deleteMany({ where: { productId } });
          if (membership.expandedIds.length > 0) {
            await tx.productCategory.createMany({
              data: membership.expandedIds.map((categoryId) => ({
                productId,
                categoryId,
                isDirect: directIds.has(categoryId),
              })),
              skipDuplicates: true,
            });
          }
        }

        if (input.images !== undefined) {
          await replaceProductImages(tx, productId, input.images);

          const nextIdSet = new Set(
            input.images.map((image) => image.mediaAssetId),
          );
          const removedMediaAssetIds = previousImages
            .map(({ mediaAssetId }) => mediaAssetId)
            .filter((id): id is string => id !== null)
            .filter((id) => !nextIdSet.has(id));
          await detachProductImages(
            tx,
            removedMediaAssetIds,
            productId,
          );
        }

        const product = await tx.product.findUniqueOrThrow({
          where: { id: productId },
          include: productInclude,
        });

        if (audit) {
          await auditLogsRepository.create(audit, tx);
        }

        return product;
      });
    } catch (error) {
      translateCatalogConstraintError(error);
    }
  }

  async updateInventory(
    productId: string,
    stockQuantity: number,
    audit?: RecordAuditLogInput,
  ) {
    try {
      return await runCatalogTransaction(async (tx) => {
        const product = await tx.product.update({
          where: { id: productId },
          data: { stockQuantity },
          include: productInclude,
        });

        if (audit) {
          await auditLogsRepository.create(audit, tx);
        }

        return product;
      });
    } catch (error) {
      translateCatalogConstraintError(error);
    }
  }

  async softDelete(productId: string, audit?: RecordAuditLogInput) {
    try {
      return await runCatalogTransaction(async (tx) => {
        const images = await tx.productImage.findMany({
          where: { productId, mediaAssetId: { not: null } },
          select: { id: true, mediaAssetId: true },
        });
        const mediaAssetIds = images
          .map(({ mediaAssetId }) => mediaAssetId)
          .filter((id): id is string => id !== null);

        await detachProductImages(tx, mediaAssetIds, productId);
        if (images.length > 0) {
          await tx.productImage.updateMany({
            where: { id: { in: images.map(({ id }) => id) } },
            data: { mediaAssetId: null },
          });
        }

        const product = await tx.product.update({
          where: { id: productId },
          data: { isDeleted: true },
          include: productInclude,
        });

        if (audit) {
          await auditLogsRepository.create(audit, tx);
        }

        return product;
      });
    } catch (error) {
      translateCatalogConstraintError(error);
    }
  }
}

function mapProductUpdate(
  input: UpdateProductRequest,
): Prisma.ProductUpdateInput {
  const data: Prisma.ProductUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.slug !== undefined) data.slug = input.slug;
  if (input.description !== undefined) data.description = input.description;
  if (input.sku !== undefined) data.sku = input.sku;
  if (input.price !== undefined) data.price = input.price;
  return data;
}
