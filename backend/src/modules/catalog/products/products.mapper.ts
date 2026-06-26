import type {
  PaginatedResult,
  ProductWithRelations,
} from "./products.types.js";

export function mapProduct(product: ProductWithRelations) {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    sku: product.sku,
    price: Number(product.price),
    stockQuantity: product.stockQuantity,
    isActive: product.isActive,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
    categories: product.categories.map(({ category }) => ({
      id: category.id,
      parentCategoryId: category.parentCategoryId,
      name: category.name,
      slug: category.slug,
      description: category.description,
      imageUrl: category.imageUrl,
      isActive: category.isActive,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString(),
    })),
    images: product.images
      .slice()
      .sort((left, right) => left.displayOrder - right.displayOrder)
      .map((image) => ({
        id: image.id,
        imageUrl: image.imageUrl,
        altText: image.altText,
        displayOrder: image.displayOrder,
        createdAt: image.createdAt.toISOString(),
        updatedAt: image.updatedAt.toISOString(),
      })),
  };
}

export function mapPaginated<TInput, TOutput>(
  result: PaginatedResult<TInput>,
  mapper: (item: TInput) => TOutput,
) {
  return {
    data: result.items.map(mapper),
    meta: {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      totalPages: result.totalPages,
    },
  };
}
