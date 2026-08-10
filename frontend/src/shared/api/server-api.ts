import "server-only";

import { cookies, headers } from "next/headers";

import { getAuthSessionToken } from "./auth-token";

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

type ResponseCookieOptions = {
  path?: string;
  maxAge?: number;
  expires?: Date;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "lax" | "strict" | "none";
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

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
  const sessionToken = withAuth ? await getAuthSessionToken() : null;
  const shouldForwardCookies = forwardCookies || (withAuth && !sessionToken);
  const cookieHeader = shouldForwardCookies
    ? requestHeaders.get("cookie")
    : null;
  const origin = getRequestOrigin(requestHeaders);

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      Accept: "application/json",
      Origin: origin,
      ...(json === undefined ? {} : { "Content-Type": "application/json" }),
      ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
    body: json === undefined ? undefined : JSON.stringify(json),
    cache: "no-store",
  });

  if (storeCookies) {
    await forwardResponseCookies(response);
  }

  const payload = await readPayload(response);

  if (!response.ok) {
    throw new ApiError(getErrorMessage(payload), response.status, payload);
  }

  return payload as T;
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
  const cookieHeader = forwardCookies ? requestHeaders.get("cookie") : null;
  const sessionToken = withAuth ? await getAuthSessionToken() : null;
  const origin = getRequestOrigin(requestHeaders);

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      Origin: origin,
      ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
    body: formData,
    cache: "no-store",
  });

  const payload = await readPayload(response);

  if (!response.ok) {
    throw new ApiError(getErrorMessage(payload), response.status, payload);
  }

  return payload as T;
}

function getRequestOrigin(requestHeaders: Headers) {
  const origin = requestHeaders.get("origin");

  if (origin) {
    return origin;
  }

  const forwardedProto = requestHeaders.get("x-forwarded-proto");
  const host = requestHeaders.get("host");

  if (host) {
    const protocol =
      forwardedProto ?? (host.startsWith("localhost") ? "http" : "https");

    return `${protocol}://${host}`;
  }

  return (
    process.env.FRONTEND_URL ??
    process.env.NEXT_PUBLIC_FRONTEND_URL ??
    "http://localhost:3000"
  );
}

async function readPayload(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type");

  if (!contentType?.includes("application/json")) {
    const text = await response.text();
    return text || null;
  }

  return response.json();
}

function getErrorMessage(payload: unknown) {
  if (payload && typeof payload === "object") {
    if (
      "error" in payload &&
      payload.error &&
      typeof payload.error === "object" &&
      "message" in payload.error &&
      typeof payload.error.message === "string"
    ) {
      return payload.error.message;
    }

    if ("message" in payload && typeof payload.message === "string") {
      return payload.message;
    }
  }

  return "The request could not be completed.";
}

async function forwardResponseCookies(response: Response) {
  const setCookieHeaders = getSetCookieHeaders(response);

  if (!setCookieHeaders.length) {
    return;
  }

  const cookieStore = await cookies();

  for (const setCookieHeader of setCookieHeaders) {
    const parsed = parseSetCookie(setCookieHeader);

    if (parsed) {
      cookieStore.set(parsed.name, parsed.value, parsed.options);
    }
  }
}

function getSetCookieHeaders(response: Response) {
  const headersWithGetSetCookie = response.headers as Headers & {
    getSetCookie?: () => string[];
  };

  const setCookieHeaders = headersWithGetSetCookie.getSetCookie?.();

  if (setCookieHeaders?.length) {
    return setCookieHeaders;
  }

  const setCookieHeader = response.headers.get("set-cookie");

  return setCookieHeader ? splitSetCookieHeader(setCookieHeader) : [];
}

function splitSetCookieHeader(header: string) {
  return header.split(/,(?=\s*[^;,\s]+=)/);
}

function parseSetCookie(header: string) {
  const [nameValue, ...attributes] = header
    .split(";")
    .map((part) => part.trim());
  const separatorIndex = nameValue.indexOf("=");

  if (separatorIndex <= 0) {
    return null;
  }

  const name = nameValue.slice(0, separatorIndex);
  const value = nameValue.slice(separatorIndex + 1);
  const options: ResponseCookieOptions = {};

  for (const attribute of attributes) {
    const [rawKey, rawValue] = attribute.split("=");
    const key = rawKey.toLowerCase();
    const attributeValue = rawValue?.trim();

    if (key === "path" && attributeValue) {
      options.path = attributeValue;
    }

    if (key === "max-age" && attributeValue) {
      options.maxAge = Number(attributeValue);
    }

    if (key === "expires" && attributeValue) {
      options.expires = new Date(attributeValue);
    }

    if (key === "httponly") {
      options.httpOnly = true;
    }

    if (key === "secure") {
      options.secure = true;
    }

    if (key === "samesite" && attributeValue) {
      const sameSite = attributeValue.toLowerCase();

      if (sameSite === "lax" || sameSite === "strict" || sameSite === "none") {
        options.sameSite = sameSite;
      }
    }
  }

  return {
    name,
    value,
    options,
  };
}
