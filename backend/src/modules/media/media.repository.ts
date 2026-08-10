import type { ImageEditSpec, MediaAssetUsage } from "@cartura/contracts/media";

import type { Prisma, PrismaClient } from "../../generated/prisma/client.js";
import { prisma } from "../../infrastructure/database/prisma.js";
import type { UploadedCloudinaryImage } from "../../infrastructure/storage/cloudinary-storage.js";
import type { AttachedResource } from "./media.types.js";

type PrismaTransaction = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

export type CreateMediaAssetInput = UploadedCloudinaryImage & {
  usage: MediaAssetUsage;
  mimeType: string;
  editSpec: ImageEditSpec;
  uploadedBy?: string | undefined;
};

export class MediaRepository {
  createMany(inputs: CreateMediaAssetInput[]) {
    return prisma.$transaction(
      inputs.map((input) =>
        prisma.mediaAsset.create({
          data: {
            provider: "cloudinary",
            publicId: input.publicId,
            secureUrl: input.secureUrl,
            canonicalUrl: input.canonicalUrl,
            usage: input.usage,
            status: "pending",
            mimeType: input.mimeType,
            format: input.format,
            bytes: input.bytes,
            width: input.width,
            height: input.height,
            editSpec: input.editSpec as Prisma.InputJsonValue,
            variants: input.variants as Prisma.InputJsonValue,
            uploadedBy: input.uploadedBy ?? null,
          },
        }),
      ),
    );
  }

  findById(mediaAssetId: string) {
    return prisma.mediaAsset.findUnique({
      where: { id: mediaAssetId },
    });
  }

  findByIds(mediaAssetIds: string[]) {
    return prisma.mediaAsset.findMany({
      where: { id: { in: mediaAssetIds } },
    });
  }

  deleteById(mediaAssetId: string) {
    return prisma.mediaAsset.delete({
      where: { id: mediaAssetId },
    });
  }

  findExpiredPending(cutoff: Date, limit = 100) {
    return prisma.mediaAsset.findMany({
      where: {
        status: "pending",
        createdAt: { lt: cutoff },
      },
      orderBy: { createdAt: "asc" },
      take: limit,
    });
  }

  markAttached(
    tx: PrismaTransaction,
    mediaAssetIds: string[],
    resource: AttachedResource,
  ) {
    if (mediaAssetIds.length === 0) {
      return Promise.resolve({ count: 0 });
    }

    return tx.mediaAsset.updateMany({
      where: { id: { in: mediaAssetIds } },
      data: {
        status: "attached",
        attachedResourceType: resource.type,
        attachedResourceId: resource.id,
        attachedAt: new Date(),
      },
    });
  }
}

export const mediaRepository = new MediaRepository();
