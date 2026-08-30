import assert from "node:assert/strict";
import { test } from "node:test";

import { StorageNotConfiguredError } from "../../infrastructure/storage/storage.errors.js";
import { MediaAttachmentService } from "./media-attachment.service.js";
import { MediaDeletionService } from "./media-deletion.service.js";
import type { MediaRepository } from "./media.repository.js";
import type { MediaStorage } from "./media-storage.js";
import type { MediaAsset } from "./media.types.js";

const assetId = "019fe859-331d-75b7-af23-55fd23031c13";

test("a crash after provider deletion leaves the asset non-attachable", async () => {
  const claimedAt = new Date("2026-08-11T10:00:00.000Z");
  const asset = mediaAsset({ status: "deleting", deletionClaimedAt: claimedAt });
  let providerDeletes = 0;
  const repository = {
    claimPendingById: async () => ({ kind: "claimed", asset }) as const,
    finalizeDeletion: async () => {
      throw new Error("database unavailable");
    },
    findByIds: async () => [asset],
  } as unknown as MediaRepository;
  const deletion = new MediaDeletionService(
    repository,
    storageWithDelete(async () => {
      providerDeletes += 1;
    }),
  );

  await assert.rejects(deletion.deletePending(assetId), /database unavailable/);
  assert.equal(providerDeletes, 1);

  const attachment = new MediaAttachmentService(repository);
  await assert.rejects(
    attachment.assertAttachableAssets([assetId], "product_image"),
    (error: unknown) => errorCode(error) === "MEDIA_ASSET_DELETION_IN_PROGRESS",
  );
});

test("cleanup can reclaim a stale deletion without exposing pending state", async () => {
  const rotatedClaim = new Date("2026-08-11T11:00:00.000Z");
  const asset = mediaAsset({
    status: "deleting",
    deletionClaimedAt: rotatedClaim,
  });
  let finalizedWith: Date | undefined;
  const repository = {
    claimExpiredPending: async () => [asset],
    finalizeDeletion: async (_id: string, claimedAt: Date) => {
      finalizedWith = claimedAt;
      return { count: 1 };
    },
  } as unknown as MediaRepository;
  const deletion = new MediaDeletionService(
    repository,
    storageWithDelete(async () => undefined),
  );

  assert.deepEqual(await deletion.cleanupExpiredPending(10), {
    deleted: 1,
    failed: 0,
  });
  assert.equal(finalizedWith, rotatedClaim);
});

test("missing media storage configuration is exposed as a safe 503", async () => {
  const asset = mediaAsset({
    status: "deleting",
    deletionClaimedAt: new Date("2026-08-11T10:00:00.000Z"),
  });
  const repository = {
    claimPendingById: async () => ({ kind: "claimed", asset }) as const,
  } as unknown as MediaRepository;
  const deletion = new MediaDeletionService(
    repository,
    storageWithDelete(async () => {
      throw new StorageNotConfiguredError("Cloudinary");
    }),
  );

  await assert.rejects(
    deletion.deletePending(assetId),
    (error: unknown) =>
      errorCode(error) === "MEDIA_STORAGE_UNAVAILABLE" &&
      errorStatus(error) === 503,
  );
});

function mediaAsset(overrides: Partial<MediaAsset>): MediaAsset {
  const now = new Date("2026-08-11T09:00:00.000Z");
  return {
    id: assetId,
    provider: "cloudinary",
    publicId: "cartura/product/example",
    secureUrl: "https://example.com/image.webp",
    canonicalUrl: "https://example.com/image.webp",
    usage: "product_image",
    status: "pending",
    mimeType: "image/webp",
    format: "webp",
    bytes: 100,
    width: 800,
    height: 800,
    editSpec: null,
    variants: {},
    uploadedBy: null,
    attachedResourceType: null,
    attachedResourceId: null,
    attachedAt: null,
    pendingExpiresAt: new Date("2026-08-12T09:00:00.000Z"),
    deletionClaimedAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function storageWithDelete(
  deleteImage: MediaStorage["deleteImage"],
): MediaStorage {
  return {
    deleteImage,
    uploadImageBuffer: async () => {
      throw new Error("not used by deletion tests");
    },
  };
}

function errorCode(error: unknown): unknown {
  return typeof error === "object" && error !== null && "code" in error
    ? error.code
    : undefined;
}

function errorStatus(error: unknown): unknown {
  return typeof error === "object" && error !== null && "statusCode" in error
    ? error.statusCode
    : undefined;
}
