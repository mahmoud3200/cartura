import type { ListProductsQuery } from "@cartura/contracts/catalog";

import type { Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../../../infrastructure/database/prisma.js";
import {
  createPaginatedResult,
  getPaginationParams,
} from "../../../shared/pagination/pagination.js";

export const productInclude = {
  images: {
    orderBy: [{ displayOrder: "asc" }, { id: "asc" }],
  },
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
    orderBy: { categoryId: "asc" },
  },
} satisfies Prisma.ProductInclude;

export type ProductWithRelations = Prisma.ProductGetPayload<{
  include: typeof productInclude;
}>;

export class ProductsQueryRepository {
  list(query: ListProductsQuery) {
    return this.listMatching(query);
  }

  listByCategory(categorySlug: string, query: ListProductsQuery) {
    return this.listMatching(query, categorySlug);
  }

  findActiveById(productId: string) {
    return prisma.product.findFirst({
      where: { id: productId, isDeleted: false },
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
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        include: productInclude,
      }),
      prisma.product.count({ where }),
    ]);

    return createPaginatedResult(items, total, query);
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
