import type { Prisma } from "../../../generated/prisma/client.js";
import { CatalogPersistenceConflictError } from "../catalog.persistence-errors.js";

export const visibleCategoryWhere = {
  isDeleted: false,
  imageAssetId: { not: null },
  imageUrl: { not: null },
} satisfies Prisma.CategoryWhereInput;

type CategoryReader = Pick<Prisma.TransactionClient, "category">;

export async function assertVisibleParentAvailable(
  tx: Prisma.TransactionClient,
  parentCategoryId: string | null,
): Promise<void> {
  if (!parentCategoryId) return;

  const parent = await tx.category.findFirst({
    where: { id: parentCategoryId, ...visibleCategoryWhere },
    select: { id: true },
  });
  if (!parent) {
    throw new CatalogPersistenceConflictError("category_hierarchy");
  }
}

export async function assertParentDoesNotCreateCycle(
  tx: Prisma.TransactionClient,
  categoryId: string,
  parentCategoryId: string | null,
): Promise<void> {
  if (!parentCategoryId) return;

  const descendants = await findCategorySubtreeIds(tx, categoryId);
  if (descendants.has(parentCategoryId)) {
    throw new CatalogPersistenceConflictError("category_cycle");
  }
}

export async function rebuildAffectedProductCategoryClosures(
  tx: Prisma.TransactionClient,
  movedCategoryId: string,
): Promise<void> {
  const subtreeIds = [...(await findCategorySubtreeIds(tx, movedCategoryId))];
  const affectedMemberships = await tx.productCategory.findMany({
    where: { categoryId: { in: subtreeIds }, isDirect: true },
    select: { productId: true },
    distinct: ["productId"],
  });

  for (const { productId } of affectedMemberships) {
    const directMemberships = await tx.productCategory.findMany({
      where: { productId, isDirect: true },
      select: { categoryId: true },
    });
    const directIds = directMemberships.map(({ categoryId }) => categoryId);
    const directIdSet = new Set(directIds);
    const expandedIds = await expandCategoryIdsWithAncestors(
      tx,
      directIds,
      false,
    );
    const inheritedIds = expandedIds.filter(
      (categoryId) => !directIdSet.has(categoryId),
    );

    await tx.productCategory.deleteMany({
      where: { productId, isDirect: false },
    });
    if (inheritedIds.length > 0) {
      await tx.productCategory.createMany({
        data: inheritedIds.map((categoryId) => ({
          productId,
          categoryId,
          isDirect: false,
        })),
        skipDuplicates: true,
      });
    }
  }
}

export async function expandCategoryIdsWithAncestors(
  client: CategoryReader,
  categoryIds: string[],
  visibleOnly: boolean,
): Promise<string[]> {
  const expandedIds = new Set(categoryIds);
  let nextIds = [...expandedIds];

  while (nextIds.length > 0) {
    const categories = await client.category.findMany({
      where: {
        id: { in: nextIds },
        ...(visibleOnly ? visibleCategoryWhere : {}),
      },
      select: { parentCategoryId: true },
    });
    const parentIds = categories
      .map(({ parentCategoryId }) => parentCategoryId)
      .filter((id): id is string => id !== null)
      .filter((id) => !expandedIds.has(id));

    parentIds.forEach((id) => expandedIds.add(id));
    nextIds = parentIds;
  }

  return [...expandedIds];
}

async function findCategorySubtreeIds(
  client: CategoryReader,
  categoryId: string,
): Promise<Set<string>> {
  const categoryIds = new Set([categoryId]);
  let parentIds = [categoryId];

  while (parentIds.length > 0) {
    const children = await client.category.findMany({
      where: { parentCategoryId: { in: parentIds } },
      select: { id: true },
    });
    parentIds = children
      .map(({ id }) => id)
      .filter((id) => !categoryIds.has(id));
    parentIds.forEach((id) => categoryIds.add(id));
  }

  return categoryIds;
}
