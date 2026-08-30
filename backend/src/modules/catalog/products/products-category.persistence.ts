import type { Prisma } from "../../../generated/prisma/client.js";
import { CatalogPersistenceConflictError } from "../catalog.persistence-errors.js";

export type ResolvedProductCategoryMembership = {
  directIds: string[];
  expandedIds: string[];
};

export async function resolveCategoryMembershipForWrite(
  tx: Prisma.TransactionClient,
  categoryIds: string[],
): Promise<ResolvedProductCategoryMembership> {
  const directIds = [...new Set(categoryIds)];
  const expandedIds = new Set(directIds);
  let nextIds = directIds;

  while (nextIds.length > 0) {
    const categories = await tx.category.findMany({
      where: {
        id: { in: nextIds },
        isDeleted: false,
        imageAssetId: { not: null },
        imageUrl: { not: null },
      },
      select: { id: true, parentCategoryId: true },
    });
    if (categories.length !== nextIds.length) {
      throw new CatalogPersistenceConflictError("category_hierarchy");
    }

    nextIds = [
      ...new Set(
        categories
          .map(({ parentCategoryId }) => parentCategoryId)
          .filter((id): id is string => id !== null)
          .filter((id) => !expandedIds.has(id)),
      ),
    ];
    nextIds.forEach((id) => expandedIds.add(id));
  }

  return { directIds, expandedIds: [...expandedIds] };
}
