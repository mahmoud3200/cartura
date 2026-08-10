import type {
  CreateAddressRequest,
  UpdateAddressRequest,
} from "@cartura/contracts/addresses";

import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../infrastructure/database/prisma.js";

export class AddressesRepository {
  listByUserId(userId: string) {
    return prisma.address.findMany({
      where: { userId },
      orderBy: [
        { isDefault: "desc" },
        { createdAt: "desc" },
      ],
    });
  }

  countByUserId(userId: string) {
    return prisma.address.count({
      where: { userId },
    });
  }

  findByIdForUser(userId: string, addressId: string) {
    return prisma.address.findFirst({
      where: {
        id: addressId,
        userId,
      },
    });
  }

  create(userId: string, input: CreateAddressRequest, isDefault: boolean) {
    return prisma.$transaction(async (tx) => {
      if (isDefault) {
        await tx.address.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.address.create({
        data: {
          userId,
          addressName: input.addressName,
          recipientName: input.recipientName,
          phoneNumber: input.phoneNumber,
          country: input.country,
          city: input.city,
          area: input.area,
          streetAddress: input.streetAddress,
          postalCode: input.postalCode ?? null,
          isDefault,
        },
      });
    });
  }

  update(userId: string, addressId: string, input: UpdateAddressRequest) {
    const data: Prisma.AddressUpdateInput = {};

    if (input.addressName !== undefined) data.addressName = input.addressName;
    if (input.recipientName !== undefined) {
      data.recipientName = input.recipientName;
    }
    if (input.phoneNumber !== undefined) data.phoneNumber = input.phoneNumber;
    if (input.country !== undefined) data.country = input.country;
    if (input.city !== undefined) data.city = input.city;
    if (input.area !== undefined) data.area = input.area;
    if (input.streetAddress !== undefined) {
      data.streetAddress = input.streetAddress;
    }
    if (input.postalCode !== undefined) data.postalCode = input.postalCode;

    return prisma.$transaction(async (tx) => {
      const address = await tx.address.findFirst({
        where: { id: addressId, userId },
      });

      if (!address) {
        return null;
      }

      return tx.address.update({
        where: { id: addressId },
        data,
      });
    });
  }

  setDefault(userId: string, addressId: string) {
    return prisma.$transaction(async (tx) => {
      const address = await tx.address.findFirst({
        where: { id: addressId, userId },
      });

      if (!address) {
        return null;
      }

      await tx.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });

      return tx.address.update({
        where: { id: addressId },
        data: { isDefault: true },
      });
    });
  }

  delete(userId: string, addressId: string) {
    return prisma.$transaction(async (tx) => {
      const address = await tx.address.findFirst({
        where: { id: addressId, userId },
      });

      if (!address) {
        return null;
      }

      await tx.address.delete({
        where: { id: addressId },
      });

      if (address.isDefault) {
        const newestRemaining = await tx.address.findFirst({
          where: { userId },
          orderBy: { createdAt: "desc" },
        });

        if (newestRemaining) {
          await tx.address.update({
            where: { id: newestRemaining.id },
            data: { isDefault: true },
          });
        }
      }

      return address;
    });
  }
}

export const addressesRepository = new AddressesRepository();
