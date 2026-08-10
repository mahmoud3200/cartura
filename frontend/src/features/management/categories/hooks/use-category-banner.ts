import { useMutation } from "@tanstack/react-query";

import {
  uploadCategoryBanner,
} from "@/features/management/shared/api/media-api";
import { unwrapManagementAction } from "@/features/management/shared/lib/action-result";
import { deleteCategoryMediaAction } from "../actions/delete-category-media.action";

export function useUploadCategoryBanner() {
  return useMutation({ mutationFn: uploadCategoryBanner });
}

export function useDeletePendingCategoryBanner() {
  return useMutation({
    mutationFn: async (mediaAssetId: string) =>
      unwrapManagementAction(await deleteCategoryMediaAction(mediaAssetId)),
  });
}
