import type { CategoryWithChildren } from "./categories.types.js";

export function mapCategory(category: CategoryWithChildren) {
  return {
    id: category.id,
    parentCategoryId: category.parentCategoryId,
    name: category.name,
    slug: category.slug,
    description: category.description,
    imageUrl: category.imageUrl,
    isActive: category.isActive,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
    children: category.children.map((child) => ({
      id: child.id,
      parentCategoryId: child.parentCategoryId,
      name: child.name,
      slug: child.slug,
      description: child.description,
      imageUrl: child.imageUrl,
      isActive: child.isActive,
      createdAt: child.createdAt.toISOString(),
      updatedAt: child.updatedAt.toISOString(),
    })),
  };
}
