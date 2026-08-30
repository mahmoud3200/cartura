import type { ImageEditSpec, MediaAssetUsage } from "@cartura/contracts/media";

import { MediaAttachmentService } from "./media-attachment.service.js";
import { MediaDeletionService } from "./media-deletion.service.js";
import {
  mediaRepository,
  type MediaRepository,
} from "./media.repository.js";
import {
  cloudinaryMediaStorage,
  type MediaStorage,
} from "./media-storage.js";
import type { AttachedResource } from "./media.types.js";
import { MediaUploadService } from "./media-upload.service.js";

export class MediaService {
  private readonly attachment: MediaAttachmentService;
  private readonly deletion: MediaDeletionService;
  private readonly upload: MediaUploadService;

  constructor(
    repository: MediaRepository = mediaRepository,
    storage: MediaStorage = cloudinaryMediaStorage,
  ) {
    this.attachment = new MediaAttachmentService(repository);
    this.deletion = new MediaDeletionService(repository, storage);
    this.upload = new MediaUploadService(repository, storage);
  }

  uploadImages(
    files: Express.Multer.File[],
    usage: MediaAssetUsage,
    edits: ImageEditSpec[],
    uploadedBy?: string,
  ) {
    return this.upload.uploadImages(files, usage, edits, uploadedBy);
  }

  assertAttachableAssets(
    mediaAssetIds: string[],
    usage: MediaAssetUsage,
    resource?: AttachedResource,
  ) {
    return this.attachment.assertAttachableAssets(
      mediaAssetIds,
      usage,
      resource,
    );
  }

  deletePending(mediaAssetId: string) {
    return this.deletion.deletePending(mediaAssetId);
  }

  cleanupExpiredPending(limit = 100) {
    return this.deletion.cleanupExpiredPending(limit);
  }
}

export const mediaService = new MediaService();
