import type { Prisma } from "../../../generated/prisma/client.js";

export type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    images: true;
    categories: {
      include: {
        category: {
          include: {
            parent: true;
          };
        };
      };
    };
  };
}>;
