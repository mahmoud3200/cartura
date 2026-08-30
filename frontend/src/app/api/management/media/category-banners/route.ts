import { mediaAssetListResponseSchema } from "@cartura/contracts/media";
import type { NextRequest } from "next/server";

import { proxyManagementFormDataPost } from "@/features/management/shared/api/management-route-proxy";
import { withBffRateLimitResponse } from "@/shared/rate-limit";

export function POST(request: NextRequest) {
  return withBffRateLimitResponse("media", () =>
    proxyManagementFormDataPost(
      request,
      "/api/v1/management/media/category-banners",
      mediaAssetListResponseSchema,
    ),
  );
}
