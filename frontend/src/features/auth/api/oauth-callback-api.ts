import "server-only";

import { getInternalServiceHeaders } from "@/shared/api/internal-service-auth";

const apiBaseUrl = (
  process.env.CARTURA_API_URL ?? "http://localhost:4000"
).replace(/\/$/, "");

type CompleteGoogleOAuthCallbackInput = {
  search: string;
  cookieHeader: string | null;
  origin: string;
  userAgent: string | null;
};

export async function completeGoogleOAuthCallback({
  search,
  cookieHeader,
  origin,
  userAgent,
}: CompleteGoogleOAuthCallbackInput) {
  const internalServiceHeaders = await getInternalServiceHeaders();

  return fetch(`${apiBaseUrl}/api/v1/auth/callback/google${search}`, {
    method: "GET",
    redirect: "manual",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      Origin: origin,
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      ...(userAgent ? { "User-Agent": userAgent } : {}),
      ...internalServiceHeaders,
    },
  });
}
