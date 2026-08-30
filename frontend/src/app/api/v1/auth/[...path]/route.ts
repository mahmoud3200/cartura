import type { NextRequest } from "next/server";

import { proxyBetterAuthRequest } from "@/features/auth/api/auth-route-proxy";

type AuthRouteContext = { params: Promise<{ path: string[] }> };

function handle(request: NextRequest, context: AuthRouteContext) {
  return context.params.then(({ path }) => proxyBetterAuthRequest(request, path));
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const OPTIONS = handle;
