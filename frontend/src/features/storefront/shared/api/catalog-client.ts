import "server-only";

import { getInternalServiceHeaders } from "@/shared/api/internal-service-auth";
import { getRateLimitResponseMetadata } from "@/shared/api/rate-limit-headers";

const apiBaseUrl = (process.env.CARTURA_API_URL ?? "http://localhost:4000")
  .replace(/\/$/, "");

export class StorefrontApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload: unknown,
    public readonly code?: string,
    public readonly retryAfterSeconds?: number,
    public readonly responseHeaders: Headers = new Headers(),
  ) {
    super(message);
    this.name = "StorefrontApiError";
  }
}

export async function fetchCatalogJson(path: string) {
  const internalServiceHeaders = await getInternalServiceHeaders();
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: {
      Accept: "application/json",
      ...internalServiceHeaders,
    },
  });
  const payload = await readPayload(response);

  if (!response.ok) {
    const metadata = getRateLimitResponseMetadata(response, payload);

    throw new StorefrontApiError(
      getErrorMessage(payload),
      response.status,
      payload,
      metadata.code,
      metadata.retryAfterSeconds,
      metadata.headers,
    );
  }

  return payload;
}

export function withSearchParams(
  path: string,
  params: Record<string, number | string | boolean | undefined>,
) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  }

  const query = searchParams.toString();

  return query ? `${path}?${query}` : path;
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

  return "The catalog could not be loaded.";
}
