import type { Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../../../infrastructure/database/prisma.js";
import type {
  CreateCategoryRequest,
  ListCategoriesQuery,
  UpdateCategoryRequest,
} from "@cartura/contracts/catalog";
import { auditLogsRepository } from "../../audit-logs/audit-logs.repository.js";
import type { RecordAuditLogInput } from "../../audit-logs/audit-logs.types.js";
import { mediaRepository } from "../../media/media.repository.js";
import {
  createPaginatedResult,
  getPaginationParams,
} from "../../../shared/pagination/pagination.js";

const categoryInclude = {
  parent: true,
} satisfies Prisma.CategoryInclude;

const visibleCategoryWhere = {
  isDeleted: false,
  imageAssetId: { not: null },
  imageUrl: { not: null },
} satisfies Prisma.CategoryWhereInput;

async function resolveAncestorsMap(parentCategoryIds: string[]) {
  const uniqueParentIds = [...new Set(parentCategoryIds.filter(Boolean))];
  if (uniqueParentIds.length === 0) return new Map();

  const ancestorMap = new Map<string, { id: string; name: string; slug: string; parentCategoryId: string | null }>();
  let nextIds = uniqueParentIds;

  while (nextIds.length > 0) {
    const parents = await prisma.category.findMany({
      where: {
        id: { in: nextIds },
        ...visibleCategoryWhere,
      },
      select: { id: true, name: true, slug: true, parentCategoryId: true }
    });

    parents.forEach(p => {
      ancestorMap.set(p.id, p);
    });

    nextIds = parents
      .map(p => p.parentCategoryId)
      .filter((id): id is string => id !== null && !ancestorMap.has(id));
  }

  return ancestorMap;
}

function getCategoryLineage(
  parentCategoryId: string | null,
  ancestorMap: Map<string, { id: string; name: string; slug: string; parentCategoryId: string | null }>
) {
  if (!parentCategoryId) return null;
  const lineage: Array<{ id: string; name: string; slug: string }> = [];
  let currentId: string | null = parentCategoryId;

  while (currentId) {
    const parent = ancestorMap.get(currentId);
    if (!parent) break;
    lineage.unshift({
      id: parent.id,
      name: parent.name,
      slug: parent.slug
    });
    currentId = parent.parentCategoryId;
  }

  return lineage.length > 0 ? lineage : null;
}

async function resolveLineage<T extends { parentCategoryId: string | null }>(
  category: T
): Promise<T & { parentCategory: Array<{ id: string; name: string; slug: string }> | null }> {
  const ancestors = await resolveAncestorsMap(category.parentCategoryId ? [category.parentCategoryId] : []);
  const parentCategory = getCategoryLineage(category.parentCategoryId, ancestors);
  return {
    ...category,
    parentCategory,
  };
}

async function resolveLineageForMany<T extends { parentCategoryId: string | null }>(
  categories: T[]
): Promise<Array<T & { parentCategory: Array<{ id: string; name: string; slug: string }> | null }>> {
  const parentIds = categories.map(c => c.parentCategoryId).filter((id): id is string => Boolean(id));
  const ancestors = await resolveAncestorsMap(parentIds);
  return categories.map(category => ({
    ...category,
    parentCategory: getCategoryLineage(category.parentCategoryId, ancestors),
  }));
}

export class CategoriesRepository {
  async list(query: ListCategoriesQuery) {
    const { skip, take } = getPaginationParams(query);
    const where: Prisma.CategoryWhereInput = {
      ...visibleCategoryWhere,
    };
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
        orderBy: [{ name: "asc" }],
        include: categoryInclude,
      }),
      prisma.category.count({ where }),
    ]);

    const itemsWithLineage = await resolveLineageForMany(items);
    return createPaginatedResult(itemsWithLineage, total, query);
  }

  async findActiveById(categoryId: string) {
    const category = await prisma.category.findFirst({
      where: { id: categoryId, isDeleted: false },
      include: categoryInclude,
    });
    if (!category) return null;
    return resolveLineage(category);
  }

  async findVisibleById(categoryId: string) {
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        ...visibleCategoryWhere,
      },
      include: categoryInclude,
    });
    if (!category) return null;
    return resolveLineage(category);
  }

  async findBySlug(slug: string) {
    const category = await prisma.category.findFirst({
      where: {
        slug,
        ...visibleCategoryWhere,
      },
      include: categoryInclude,
    });
    if (!category) return null;
    return resolveLineage(category);
  }

  async findBySlugAnyStatus(slug: string) {
    const category = await prisma.category.findUnique({
      where: { slug },
      include: categoryInclude,
    });
    if (!category) return null;
    return resolveLineage(category);
  }

  countActiveByIds(categoryIds: string[]) {
    return prisma.category.count({
      where: {
        id: { in: categoryIds },
        ...visibleCategoryWhere,
      },
    });
  }

  async expandWithAncestorIds(categoryIds: string[]) {
    const expandedIds = new Set(categoryIds);
    let nextIds = [...expandedIds];

    while (nextIds.length > 0) {
      const categories = await prisma.category.findMany({
        where: {
          id: { in: nextIds },
          ...visibleCategoryWhere,
        },
        select: {
          parentCategoryId: true,
        },
      });
      const parentIds = categories
        .map((category) => category.parentCategoryId)
        .filter((categoryId): categoryId is string => Boolean(categoryId))
        .filter((categoryId) => !expandedIds.has(categoryId));

      parentIds.forEach((categoryId) => expandedIds.add(categoryId));
      nextIds = parentIds;
    }

    return [...expandedIds];
  }

  create(
    input: CreateCategoryRequest,
    createdBy?: string,
    audit?: RecordAuditLogInput,
  ) {
    return prisma.$transaction(async (tx) => {
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

      await mediaRepository.markAttached(tx, [imageAsset.id], {
        type: "category",
        id: category.id,
      });

      if (audit) {
        await auditLogsRepository.create({
          ...audit,
          resourceId: category.id,
        }, tx);
      }

      return resolveLineage(category);
    });
  }

  update(
    categoryId: string,
    input: UpdateCategoryRequest,
    audit?: RecordAuditLogInput,
  ) {
    const data: Prisma.CategoryUncheckedUpdateInput = {};

    if (input.parentCategoryId !== undefined) {
      data.parentCategoryId = input.parentCategoryId;
    }

    if (input.name !== undefined) data.name = input.name;
    if (input.slug !== undefined) data.slug = input.slug;
    if (input.description !== undefined) data.description = input.description;

    return prisma.$transaction(async (tx) => {
      const imageAsset =
        input.imageAssetId === undefined
          ? null
          : await tx.mediaAsset.findUniqueOrThrow({
              where: { id: input.imageAssetId! },
            });

      if (imageAsset) {
        data.imageAssetId = imageAsset.id;
        data.imageUrl = imageAsset.canonicalUrl;
      }

      const category = await tx.category.update({
        where: { id: categoryId },
        data,
        include: categoryInclude,
      });

      if (imageAsset) {
        await mediaRepository.markAttached(tx, [imageAsset.id], {
          type: "category",
          id: category.id,
        });
      }

      if (audit) {
        await auditLogsRepository.create(audit, tx);
      }

      return resolveLineage(category);
    });
  }

  softDelete(categoryId: string, audit?: RecordAuditLogInput) {
    return prisma.$transaction(async (tx) => {
      await tx.category.update({
        where: { id: categoryId },
        data: { isDeleted: true },
      });

      if (audit) {
        await auditLogsRepository.create(audit, tx);
      }
    });
  }
}

export const categoriesRepository = new CategoriesRepository();
