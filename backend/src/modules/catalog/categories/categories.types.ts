import type { Prisma } from "../../../generated/prisma/client.js";

export type CategoryWithChildren = Prisma.CategoryGetPayload<{
  include: {
    children: true;
  };
}>;
