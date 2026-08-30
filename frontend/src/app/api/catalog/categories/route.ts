import { categoryListResponseSchema } from "@cartura/contracts/catalog";
import type { NextRequest } from "next/server";

import { proxyManagementGet } from "@/features/management/shared/api/management-route-proxy";
import { withBffRateLimitResponse } from "@/shared/rate-limit";

export function GET(request: NextRequest) {
  return withBffRateLimitResponse("read", () =>
    proxyManagementGet(request, "/api/v1/catalog/categories", {
      withAuth: false,
      responseSchema: categoryListResponseSchema,
    }),
  );
}
