import type { Prisma } from "../../../generated/prisma/client.js";

export type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    images: true;
    categories: {
      include: {
        category: true;
      };
    };
  };
}>;

export type PaginatedResult<TItem> = {
  items: TItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};
