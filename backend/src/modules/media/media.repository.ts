import type { ImageEditSpec, MediaAssetUsage } from "@cartura/contracts/media";

import { env } from "../../config/env.js";
import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../infrastructure/database/prisma.js";
import type { UploadedCloudinaryImage } from "../../infrastructure/storage/cloudinary-storage.js";
import type { AttachedResource } from "./media.types.js";

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
            pendingExpiresAt: getPendingExpiration(),
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

  markAttached(
    tx: Prisma.TransactionClient,
    mediaAssetIds: string[],
    resource: AttachedResource,
  ) {
    const uniqueIds = [...new Set(mediaAssetIds)];
    if (uniqueIds.length === 0) {
      return Promise.resolve({ count: 0 });
    }

    return tx.mediaAsset.updateMany({
      where: {
        id: { in: uniqueIds },
        OR: [
          {
            status: "pending",
            pendingExpiresAt: { gt: new Date() },
          },
          {
            status: "attached",
            attachedResourceType: resource.type,
            attachedResourceId: resource.id,
          },
        ],
      },
      data: {
        status: "attached",
        attachedResourceType: resource.type,
        attachedResourceId: resource.id,
        attachedAt: new Date(),
        pendingExpiresAt: null,
        deletionClaimedAt: null,
      },
    });
  }

  markPending(
    tx: Prisma.TransactionClient,
    mediaAssetIds: string[],
    resource: AttachedResource,
  ) {
    const uniqueIds = [...new Set(mediaAssetIds)];
    if (uniqueIds.length === 0) {
      return Promise.resolve({ count: 0 });
    }

    return tx.mediaAsset.updateMany({
      where: {
        id: { in: uniqueIds },
        status: "attached",
        attachedResourceType: resource.type,
        attachedResourceId: resource.id,
      },
      data: {
        status: "pending",
        attachedResourceType: null,
        attachedResourceId: null,
        attachedAt: null,
        pendingExpiresAt: getPendingExpiration(),
        deletionClaimedAt: null,
      },
    });
  }

  claimPendingById(mediaAssetId: string) {
    return prisma.$transaction(async (tx) => {
      const claimedAt = new Date();
      const claim = await tx.mediaAsset.updateMany({
        where: { id: mediaAssetId, status: "pending" },
        data: { status: "deleting", deletionClaimedAt: claimedAt },
      });

      if (claim.count === 1) {
        const asset = await tx.mediaAsset.findUniqueOrThrow({
          where: { id: mediaAssetId },
        });
        return { kind: "claimed", asset } as const;
      }

      const asset = await tx.mediaAsset.findUnique({
        where: { id: mediaAssetId },
        select: { status: true },
      });
      return asset
        ? ({ kind: "not_pending", status: asset.status } as const)
        : ({ kind: "not_found" } as const);
    });
  }

  claimExpiredPending(
    expiresBefore: Date,
    staleClaimBefore: Date,
    limit = 100,
  ) {
    return prisma.$transaction(async (tx) => {
      const candidates = await tx.mediaAsset.findMany({
        where: {
          OR: [
            {
              status: "pending",
              pendingExpiresAt: { lt: expiresBefore },
            },
            {
              status: "deleting",
              deletionClaimedAt: { lt: staleClaimBefore },
            },
          ],
        },
        orderBy: [
          { deletionClaimedAt: "asc" },
          { pendingExpiresAt: "asc" },
          { id: "asc" },
        ],
        select: { id: true },
        take: limit,
      });
      if (candidates.length === 0) return [];

      const claimedAt = new Date();
      return tx.mediaAsset.updateManyAndReturn({
        where: {
          id: { in: candidates.map(({ id }) => id) },
          OR: [
            {
              status: "pending",
              pendingExpiresAt: { lt: expiresBefore },
            },
            {
              status: "deleting",
              deletionClaimedAt: { lt: staleClaimBefore },
            },
          ],
        },
        data: { status: "deleting", deletionClaimedAt: claimedAt },
      });
    }, { isolationLevel: "Serializable" });
  }

  finalizeDeletion(mediaAssetId: string, claimedAt: Date) {
    return prisma.mediaAsset.deleteMany({
      where: {
        id: mediaAssetId,
        status: "deleting",
        deletionClaimedAt: claimedAt,
      },
    });
  }
}

export const mediaRepository = new MediaRepository();

function getPendingExpiration(): Date {
  return new Date(
    Date.now() + env.MEDIA_PENDING_TTL_HOURS * 60 * 60 * 1000,
  );
}
