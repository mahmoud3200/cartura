import type { Prisma } from "../../generated/prisma/client.js";

export type CartWithItems = Prisma.CartGetPayload<{
  include: {
    items: {
      include: {
        product: {
          include: {
            images: true;
          };
        };
      };
    };
  };
}>;

export type CartItemWithProduct = CartWithItems["items"][number];
