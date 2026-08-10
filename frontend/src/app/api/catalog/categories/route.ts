import type { NextRequest } from "next/server";

import { proxyManagementGet } from "@/features/management/shared/api/management-route-proxy";

export function GET(request: NextRequest) {
  return proxyManagementGet(request, "/api/v1/catalog/categories", {
    withAuth: false,
  });
}
