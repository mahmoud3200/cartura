import type { Prisma } from "../../../generated/prisma/client.js";

export type CategoryWithParent = Prisma.CategoryGetPayload<{
  include: {
    parent: true;
  };
}>;

export type CategoryWithLineage = CategoryWithParent & {
  parentCategory: Array<{ id: string; name: string; slug: string }> | null;
};
