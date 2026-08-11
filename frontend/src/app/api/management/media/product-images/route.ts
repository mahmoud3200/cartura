import { mediaAssetListResponseSchema } from "@cartura/contracts/media";
import type { NextRequest } from "next/server";

import { proxyManagementFormDataPost } from "@/features/management/shared/api/management-route-proxy";

export function POST(request: NextRequest) {
  return proxyManagementFormDataPost(
    request,
    "/api/v1/management/media/product-images",
    mediaAssetListResponseSchema,
  );
}
