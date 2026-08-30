import type { ListCategoriesQuery } from "@cartura/contracts/catalog";

import type { Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../../../infrastructure/database/prisma.js";
import {
  createPaginatedResult,
  getPaginationParams,
} from "../../../shared/pagination/pagination.js";
import {
  expandCategoryIdsWithAncestors,
  visibleCategoryWhere,
} from "./categories-hierarchy.persistence.js";

export const categoryInclude = {
  parent: true,
  children: {
    where: visibleCategoryWhere,
    orderBy: [{ name: "asc" }, { id: "asc" }],
  },
} satisfies Prisma.CategoryInclude;

export type CategoryRepositoryRecord = Prisma.CategoryGetPayload<{
  include: typeof categoryInclude;
}>;

type CategoryAncestor = {
  id: string;
  name: string;
  slug: string;
};

export type CategoryWithLineage = CategoryRepositoryRecord & {
  parentCategory: CategoryAncestor[] | null;
};

type CategoryAncestorRow = CategoryAncestor & {
  parentCategoryId: string | null;
};

type CategoryReader = Pick<Prisma.TransactionClient, "category">;

export class CategoriesQueryRepository {
  async list(query: ListCategoriesQuery) {
    const { skip, take } = getPaginationParams(query);
    const where: Prisma.CategoryWhereInput = { ...visibleCategoryWhere };
    if (query.q !== undefined) {
      where.OR = [
        { name: { contains: query.q, mode: "insensitive" } },
        { slug: { contains: query.q, mode: "insensitive" } },
      ];
    }
    if (query.parentCategoryId !== undefined) {
      where.parentCategoryId = query.parentCategoryId;
    }

    const [items, total] = await Promise.all([
      prisma.category.findMany({
        where,
        skip,
        take,
        orderBy: [{ name: "asc" }, { id: "asc" }],
        include: categoryInclude,
      }),
      prisma.category.count({ where }),
    ]);
    const withLineage = await resolveLineageForMany(prisma, items);
    return createPaginatedResult(withLineage, total, query);
  }

  findActiveById(categoryId: string) {
    return this.findFirstWithLineage({ id: categoryId, isDeleted: false });
  }

  findVisibleById(categoryId: string) {
    return this.findFirstWithLineage({
      id: categoryId,
      ...visibleCategoryWhere,
    });
  }

  findBySlug(slug: string) {
    return this.findFirstWithLineage({ slug, ...visibleCategoryWhere });
  }

  async findBySlugAnyStatus(slug: string) {
    const category = await prisma.category.findUnique({
      where: { slug },
      include: categoryInclude,
    });
    return category ? resolveLineage(prisma, category) : null;
  }

  countActiveByIds(categoryIds: string[]) {
    return prisma.category.count({
      where: { id: { in: categoryIds }, ...visibleCategoryWhere },
    });
  }

  expandWithAncestorIds(categoryIds: string[]) {
    return expandCategoryIdsWithAncestors(prisma, categoryIds, true);
  }

  private async findFirstWithLineage(where: Prisma.CategoryWhereInput) {
    const category = await prisma.category.findFirst({
      where,
      include: categoryInclude,
    });
    return category ? resolveLineage(prisma, category) : null;
  }
}

export async function resolveLineage<
  T extends { parentCategoryId: string | null },
>(
  client: CategoryReader,
  category: T,
): Promise<T & { parentCategory: CategoryAncestor[] | null }> {
  const ancestors = await resolveAncestorsMap(
    client,
    category.parentCategoryId ? [category.parentCategoryId] : [],
  );
  return {
    ...category,
    parentCategory: getCategoryLineage(category.parentCategoryId, ancestors),
  };
}

async function resolveLineageForMany<
  T extends { parentCategoryId: string | null },
>(client: CategoryReader, categories: T[]) {
  const parentIds = categories
    .map((category) => category.parentCategoryId)
    .filter((id): id is string => id !== null);
  const ancestors = await resolveAncestorsMap(client, parentIds);
  return categories.map((category) => ({
    ...category,
    parentCategory: getCategoryLineage(category.parentCategoryId, ancestors),
  }));
}

async function resolveAncestorsMap(
  client: CategoryReader,
  parentCategoryIds: string[],
) {
  const ancestorMap = new Map<string, CategoryAncestorRow>();
  let nextIds = [...new Set(parentCategoryIds)];

  while (nextIds.length > 0) {
    const parents = await client.category.findMany({
      where: { id: { in: nextIds }, ...visibleCategoryWhere },
      select: { id: true, name: true, slug: true, parentCategoryId: true },
    });
    parents.forEach((parent) => ancestorMap.set(parent.id, parent));
    nextIds = parents
      .map(({ parentCategoryId }) => parentCategoryId)
      .filter(
        (id): id is string => id !== null && !ancestorMap.has(id),
      );
  }

  return ancestorMap;
}

function getCategoryLineage(
  parentCategoryId: string | null,
  ancestorMap: Map<string, CategoryAncestorRow>,
) {
  if (!parentCategoryId) return null;

  const lineage: CategoryAncestor[] = [];
  const visited = new Set<string>();
  let currentId: string | null = parentCategoryId;
  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);
    const parent = ancestorMap.get(currentId);
    if (!parent) break;
    lineage.unshift({ id: parent.id, name: parent.name, slug: parent.slug });
    currentId = parent.parentCategoryId;
  }

  return lineage.length > 0 ? lineage : null;
}
