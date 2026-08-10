import type { Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../../../infrastructure/database/prisma.js";
import {
  createPaginatedResult,
  getPaginationParams,
} from "../../../shared/pagination/pagination.js";
import type {
  CreateProductRequest,
  ListProductsQuery,
  ProductImageInput,
  UpdateProductRequest,
} from "@cartura/contracts/catalog";
import { auditLogsRepository } from "../../audit-logs/audit-logs.repository.js";
import type { RecordAuditLogInput } from "../../audit-logs/audit-logs.types.js";
import { mediaRepository } from "../../media/media.repository.js";

const productInclude = {
  images: true,
  categories: {
    where: {
      category: {
        isDeleted: false,
        imageAssetId: { not: null },
        imageUrl: { not: null },
      },
    },
    include: {
      category: {
        include: {
          parent: true,
        },
      },
    },
  },
} satisfies Prisma.ProductInclude;

export class ProductsRepository {
  list(query: ListProductsQuery) {
    return this.listMatching(query);
  }

  listByCategory(categorySlug: string, query: ListProductsQuery) {
    return this.listMatching(query, categorySlug);
  }

  private async listMatching(
    query: ListProductsQuery,
    categorySlug?: string,
  ) {
    const where = buildProductWhere(query, categorySlug);
    const { skip, take } = getPaginationParams(query);

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take,
        orderBy: [{ createdAt: "desc" }],
        include: productInclude,
      }),
      prisma.product.count({ where }),
    ]);

    return createPaginatedResult(items, total, query);
  }

  findById(productId: string) {
    return prisma.product.findUnique({
      where: { id: productId },
      include: productInclude,
    });
  }

  findBySlug(slug: string) {
    return prisma.product.findFirst({
      where: { slug, isDeleted: false },
      include: productInclude,
    });
  }

  findBySku(sku: string) {
    return prisma.product.findFirst({
      where: { sku, isDeleted: false },
      include: productInclude,
    });
  }

  create(
    input: CreateProductRequest,
    createdBy?: string,
    audit?: RecordAuditLogInput,
  ) {
    return prisma.$transaction(async (tx) => {
      const imageAssets = await getMediaAssetMap(
        tx,
        input.images.map((image) => image.mediaAssetId),
      );
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
            create: input.categoryIds.map((categoryId) => ({
              categoryId,
            })),
          },
          images: {
            create: input.images.map((image) =>
              mapImageInput(image, imageAssets),
            ),
          },
        },
        include: productInclude,
      });

      await mediaRepository.markAttached(
        tx,
        input.images.map((image) => image.mediaAssetId),
        { type: "product", id: product.id },
      );

      if (audit) {
        await auditLogsRepository.create({
          ...audit,
          resourceId: product.id,
        }, tx);
      }

      return product;
    });
  }

  update(
    productId: string,
    input: UpdateProductRequest,
    audit?: RecordAuditLogInput,
  ) {
    return prisma.$transaction(async (tx) => {
      const data: Prisma.ProductUpdateInput = {};

      if (input.name !== undefined) data.name = input.name;
      if (input.slug !== undefined) data.slug = input.slug;
      if (input.description !== undefined) data.description = input.description;
      if (input.sku !== undefined) data.sku = input.sku;
      if (input.price !== undefined) data.price = input.price;
      if (input.stockQuantity !== undefined) {
        data.stockQuantity = input.stockQuantity;
      }
      if (input.isDeleted !== undefined) data.isDeleted = input.isDeleted;

      await tx.product.update({
        where: { id: productId },
        data,
      });

      if (input.categoryIds !== undefined) {
        await tx.productCategory.deleteMany({ where: { productId } });
        if (input.categoryIds.length > 0) {
          await tx.productCategory.createMany({
            data: input.categoryIds.map((categoryId) => ({
              productId,
              categoryId,
            })),
            skipDuplicates: true,
          });
        }
      }

      if (input.images !== undefined) {
        const imageAssets = await getMediaAssetMap(
          tx,
          input.images.map((image) => image.mediaAssetId),
        );
        await tx.productImage.deleteMany({ where: { productId } });
        if (input.images.length > 0) {
          await tx.productImage.createMany({
            data: input.images.map((image) => ({
              productId,
              ...mapImageInput(image, imageAssets),
            })),
          });
          await mediaRepository.markAttached(
            tx,
            input.images.map((image) => image.mediaAssetId),
            { type: "product", id: productId },
          );
        }
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
  }

  updateInventory(
    productId: string,
    stockQuantity: number,
    audit?: RecordAuditLogInput,
  ) {
    return prisma.$transaction(async (tx) => {
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
  }

  softDelete(productId: string, audit?: RecordAuditLogInput) {
    return prisma.$transaction(async (tx) => {
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
  }
}

export function buildProductWhere(
  query: ListProductsQuery,
  categorySlug?: string,
): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {
    isDeleted: false,
  };

  if (query.q) {
    where.OR = [
      { name: { contains: query.q, mode: "insensitive" } },
      { description: { contains: query.q, mode: "insensitive" } },
      { sku: { contains: query.q, mode: "insensitive" } },
      {
        categories: {
          some: {
            category: {
              isDeleted: false,
              imageAssetId: { not: null },
              imageUrl: { not: null },
              OR: [
                { name: { contains: query.q, mode: "insensitive" } },
                { slug: { contains: query.q, mode: "insensitive" } },
              ],
            },
          },
        },
      },
    ];
  }

  if (categorySlug) {
    where.categories = {
      some: {
        category: {
          slug: categorySlug,
          isDeleted: false,
          imageAssetId: { not: null },
          imageUrl: { not: null },
        },
      },
    };
  }

  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    const price: Prisma.DecimalFilter<"Product"> = {};

    if (query.minPrice !== undefined) {
      price.gte = query.minPrice;
    }

    if (query.maxPrice !== undefined) {
      price.lte = query.maxPrice;
    }

    where.price = price;
  }

  if (query.inStock !== undefined) {
    where.stockQuantity = query.inStock ? { gt: 0 } : { equals: 0 };
  }

  return where;
}

async function getMediaAssetMap(
  tx: Prisma.TransactionClient,
  mediaAssetIds: string[],
) {
  if (mediaAssetIds.length === 0) {
    return new Map<string, { id: string; canonicalUrl: string }>();
  }

  const assets = await tx.mediaAsset.findMany({
    where: { id: { in: mediaAssetIds } },
    select: { id: true, canonicalUrl: true },
  });

  if (assets.length !== new Set(mediaAssetIds).size) {
    throw new Error("One or more media assets were not found");
  }

  return new Map(assets.map((asset) => [asset.id, asset]));
}

function mapImageInput(
  image: ProductImageInput,
  imageAssets: Map<string, { id: string; canonicalUrl: string }>,
) {
  const imageAsset = imageAssets.get(image.mediaAssetId);

  if (!imageAsset) {
    throw new Error("Product image media asset was not resolved");
  }

  return {
    mediaAssetId: image.mediaAssetId,
    imageUrl: imageAsset.canonicalUrl,
    altText: image.altText ?? null,
    displayOrder: image.displayOrder,
  };
}

export const productsRepository = new ProductsRepository();
