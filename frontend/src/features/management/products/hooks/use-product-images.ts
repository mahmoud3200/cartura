import { useMutation } from "@tanstack/react-query";

import {
  uploadProductImage,
} from "@/features/management/shared/api/media-api";
import { unwrapManagementAction } from "@/features/management/shared/lib/action-result";
import { deleteProductMediaAction } from "../actions/delete-product-media.action";

export function useUploadProductImage() {
  return useMutation({ mutationFn: uploadProductImage });
}

export function useDeletePendingProductImage() {
  return useMutation({
    mutationFn: async (mediaAssetId: string) =>
      unwrapManagementAction(await deleteProductMediaAction(mediaAssetId)),
  });
}
