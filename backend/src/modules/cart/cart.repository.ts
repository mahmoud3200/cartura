import { prisma } from "../../infrastructure/database/prisma.js";

const cartInclude = {
  items: {
    include: {
      product: {
        include: {
          images: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  },
} as const;

export class CartRepository {
  findByUserId(userId: string) {
    return prisma.cart.findUnique({
      where: { userId },
      include: cartInclude,
    });
  }

  createForUser(userId: string) {
    return prisma.cart.create({
      data: { userId },
      include: cartInclude,
    });
  }

  findOrCreateByUserId(userId: string) {
    return prisma.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
      include: cartInclude,
    });
  }

  findProductById(productId: string) {
    return prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        isActive: true,
        stockQuantity: true,
      },
    });
  }

  async addItem(input: {
    userId: string;
    productId: string;
    quantity: number;
  }) {
    const cart = await this.findOrCreateByUserId(input.userId);
    const existingItem = cart.items.find(
      (item) => item.productId === input.productId,
    );

    await prisma.cartItem.upsert({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: input.productId,
        },
      },
      update: {
        quantity: (existingItem?.quantity ?? 0) + input.quantity,
      },
      create: {
        cartId: cart.id,
        productId: input.productId,
        quantity: input.quantity,
      },
    });

    return this.findOrCreateByUserId(input.userId);
  }

  async updateItem(input: {
    userId: string;
    productId: string;
    quantity: number;
  }) {
    const cart = await this.findOrCreateByUserId(input.userId);

    if (input.quantity === 0) {
      await prisma.cartItem.deleteMany({
        where: {
          cartId: cart.id,
          productId: input.productId,
        },
      });
    } else {
      await prisma.cartItem.update({
        where: {
          cartId_productId: {
            cartId: cart.id,
            productId: input.productId,
          },
        },
        data: {
          quantity: input.quantity,
        },
      });
    }

    return this.findOrCreateByUserId(input.userId);
  }

  async removeItem(userId: string, productId: string) {
    const cart = await this.findOrCreateByUserId(userId);

    await prisma.cartItem.deleteMany({
      where: {
        cartId: cart.id,
        productId,
      },
    });

    return this.findOrCreateByUserId(userId);
  }

  async clear(userId: string) {
    const cart = await this.findOrCreateByUserId(userId);

    await prisma.cartItem.deleteMany({
      where: {
        cartId: cart.id,
      },
    });

    return this.findOrCreateByUserId(userId);
  }
}

export const cartRepository = new CartRepository();
