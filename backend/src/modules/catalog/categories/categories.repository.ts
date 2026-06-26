import type { Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../../../infrastructure/database/prisma.js";
import type {
  CreateCategoryRequest,
  ListCategoriesQuery,
  UpdateCategoryRequest,
} from "@cartura/contracts/catalog";

const categoryInclude = {
  children: true,
} satisfies Prisma.CategoryInclude;

export class CategoriesRepository {
  list(query: ListCategoriesQuery) {
    return prisma.category.findMany({
      where: {
        isActive: true,
        parentCategoryId: query.parentCategoryId ?? null,
      },
      orderBy: [{ name: "asc" }],
      include: categoryInclude,
    });
  }

  findById(categoryId: string) {
    return prisma.category.findUnique({
      where: { id: categoryId },
      include: categoryInclude,
    });
  }

  findBySlug(slug: string) {
    return prisma.category.findFirst({
      where: { slug, isActive: true },
      include: categoryInclude,
    });
  }

  findBySlugAnyStatus(slug: string) {
    return prisma.category.findUnique({
      where: { slug },
      include: categoryInclude,
    });
  }

  countActiveByIds(categoryIds: string[]) {
    return prisma.category.count({
      where: {
        id: { in: categoryIds },
        isActive: true,
      },
    });
  }

  create(input: CreateCategoryRequest, createdBy?: string) {
    return prisma.category.create({
      data: {
        parentCategoryId: input.parentCategoryId ?? null,
        name: input.name,
        slug: input.slug,
        description: input.description ?? null,
        imageUrl: input.imageUrl ?? null,
        createdBy: createdBy ?? null,
      },
      include: categoryInclude,
    });
  }

  update(categoryId: string, input: UpdateCategoryRequest) {
    const data: Prisma.CategoryUpdateInput = {};

    if (input.parentCategoryId !== undefined) {
      data.parent =
        input.parentCategoryId === null
          ? { disconnect: true }
          : { connect: { id: input.parentCategoryId } };
    }

    if (input.name !== undefined) data.name = input.name;
    if (input.slug !== undefined) data.slug = input.slug;
    if (input.description !== undefined) data.description = input.description;
    if (input.imageUrl !== undefined) data.imageUrl = input.imageUrl;
    if (input.isActive !== undefined) data.isActive = input.isActive;

    return prisma.category.update({
      where: { id: categoryId },
      data,
      include: categoryInclude,
    });
  }

  deactivate(categoryId: string) {
    return prisma.category.update({
      where: { id: categoryId },
      data: { isActive: false },
      include: categoryInclude,
    });
  }
}

export const categoriesRepository = new CategoriesRepository();
