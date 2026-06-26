import type { Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../../../infrastructure/database/prisma.js";
import type {
  CreateProductRequest,
  ListProductsQuery,
  ProductImageInput,
  UpdateProductRequest,
} from "@cartura/contracts/catalog";

const productInclude = {
  images: true,
  categories: {
    include: {
      category: true,
    },
  },
} satisfies Prisma.ProductInclude;

export class ProductsRepository {
  async list(query: ListProductsQuery) {
    const where = buildProductWhere(query);
    const skip = (query.page - 1) * query.pageSize;

    const [items, total] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        skip,
        take: query.pageSize,
        orderBy: [{ createdAt: "desc" }],
        include: productInclude,
      }),
      prisma.product.count({ where }),
    ]);

    return {
      items,
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    };
  }

  findById(productId: string) {
    return prisma.product.findUnique({
      where: { id: productId },
      include: productInclude,
    });
  }

  findBySlug(slug: string) {
    return prisma.product.findFirst({
      where: { slug, isActive: true },
      include: productInclude,
    });
  }

  findBySlugAnyStatus(slug: string) {
    return prisma.product.findUnique({
      where: { slug },
      include: productInclude,
    });
  }

  findBySku(sku: string) {
    return prisma.product.findUnique({
      where: { sku },
      include: productInclude,
    });
  }

  create(input: CreateProductRequest, createdBy?: string) {
    return prisma.product.create({
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
          create: input.images.map(mapImageInput),
        },
      },
      include: productInclude,
    });
  }

  update(productId: string, input: UpdateProductRequest) {
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
      if (input.isActive !== undefined) data.isActive = input.isActive;

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
        await tx.productImage.deleteMany({ where: { productId } });
        if (input.images.length > 0) {
          await tx.productImage.createMany({
            data: input.images.map((image) => ({
              productId,
              ...mapImageInput(image),
            })),
          });
        }
      }

      return tx.product.findUniqueOrThrow({
        where: { id: productId },
        include: productInclude,
      });
    });
  }

  updateInventory(productId: string, stockQuantity: number) {
    return prisma.product.update({
      where: { id: productId },
      data: { stockQuantity },
      include: productInclude,
    });
  }

  deactivate(productId: string) {
    return prisma.product.update({
      where: { id: productId },
      data: { isActive: false },
      include: productInclude,
    });
  }
}

function buildProductWhere(query: ListProductsQuery): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {
    isActive: true,
  };

  if (query.q) {
    where.OR = [
      { name: { contains: query.q, mode: "insensitive" } },
      { description: { contains: query.q, mode: "insensitive" } },
      { sku: { contains: query.q, mode: "insensitive" } },
    ];
  }

  if (query.categorySlug) {
    where.categories = {
      some: {
        category: {
          slug: query.categorySlug,
          isActive: true,
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

function mapImageInput(image: ProductImageInput) {
  return {
    imageUrl: image.imageUrl,
    altText: image.altText ?? null,
    displayOrder: image.displayOrder,
  };
}

export const productsRepository = new ProductsRepository();
