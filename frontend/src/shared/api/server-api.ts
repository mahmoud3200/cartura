import "server-only";

import { cookies, headers } from "next/headers";

import { getAuthSessionToken } from "./auth-token";
import { getInternalServiceHeaders } from "./internal-service-auth";
import { readApiResponse } from "./server-api-response";
import { getRequestOrigin } from "./server-request-origin";
import { forwardResponseCookies } from "./server-response-cookies";

export { ApiError } from "./server-api-error";

type ApiFetchOptions = Omit<RequestInit, "body" | "headers"> & {
  json?: unknown;
  forwardCookies?: boolean;
  storeCookies?: boolean;
  withAuth?: boolean;
};

type ApiFormDataFetchOptions = Omit<RequestInit, "body" | "headers"> & {
  formData: FormData;
  forwardCookies?: boolean;
  withAuth?: boolean;
};

const apiBaseUrl = process.env.CARTURA_API_URL ?? "http://localhost:4000";

export async function serverApiFetch<T>(
  path: string,
  {
    json,
    forwardCookies = false,
    storeCookies = false,
    withAuth = true,
    ...init
  }: ApiFetchOptions = {},
): Promise<T> {
  const requestHeaders = await headers();
  const internalServiceHeaders = await getInternalServiceHeaders();
  const sessionToken = withAuth ? await getAuthSessionToken() : null;
  const shouldForwardCookies = forwardCookies || (withAuth && !sessionToken);
  const cookieHeader = shouldForwardCookies
    ? requestHeaders.get("cookie")
    : null;

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      Accept: "application/json",
      Origin: getRequestOrigin(requestHeaders),
      ...(json === undefined ? {} : { "Content-Type": "application/json" }),
      ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      ...internalServiceHeaders,
    },
    body: json === undefined ? undefined : JSON.stringify(json),
    cache: "no-store",
  });

  if (storeCookies) {
    forwardResponseCookies(response, await cookies());
  }

  return readApiResponse<T>(response);
}

export async function serverApiFormDataFetch<T>(
  path: string,
  {
    formData,
    forwardCookies = false,
    withAuth = true,
    ...init
  }: ApiFormDataFetchOptions,
): Promise<T> {
  const requestHeaders = await headers();
  const internalServiceHeaders = await getInternalServiceHeaders();
  const cookieHeader = forwardCookies ? requestHeaders.get("cookie") : null;
  const sessionToken = withAuth ? await getAuthSessionToken() : null;

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      Origin: getRequestOrigin(requestHeaders),
      ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      ...internalServiceHeaders,
    },
    body: formData,
    cache: "no-store",
  });

  return readApiResponse<T>(response);
}
