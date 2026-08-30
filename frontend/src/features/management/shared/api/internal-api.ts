import { getRateLimitResponseMetadata } from "@/shared/api/rate-limit-headers";

export class InternalApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload: unknown,
    public readonly code?: string,
    public readonly retryAfterSeconds?: number,
    public readonly responseHeaders: Headers = new Headers(),
  ) {
    super(message);
    this.name = "InternalApiError";
  }
}

export async function fetchInternalJson(path: string, init?: RequestInit) {
  const isFormData = init?.body instanceof FormData;
  const response = await fetch(path, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.body === undefined || isFormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...init?.headers,
    },
  });
  const payload = await readPayload(response);

  if (!response.ok) {
    const metadata = getRateLimitResponseMetadata(response, payload);

    throw new InternalApiError(
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

async function readPayload(response: Response) {
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
