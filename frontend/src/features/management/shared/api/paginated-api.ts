import {
  paginatedResponseSchema,
  type PaginationMetadata,
} from "@cartura/contracts/common";
import { z } from "zod";

export type PaginationMeta = PaginationMetadata;

export type PaginationInput = {
  page?: number;
  limit: number;
};

export class InternalApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload: unknown,
  ) {
    super(message);
    this.name = "InternalApiError";
  }
}

export async function fetchPaginated<T extends z.ZodType>(
  path: string,
  itemSchema: T,
  pagination: number | PaginationInput,
  options: { searchParams?: Record<string, string> } = {},
) {
  const page =
    typeof pagination === "number" ? 1 : Math.max(1, pagination.page ?? 1);
  const limit = typeof pagination === "number" ? pagination : pagination.limit;
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  for (const [key, value] of Object.entries(options.searchParams ?? {})) {
    params.set(key, value);
  }

  const payload = await fetchInternalJson(`${path}?${params.toString()}`);

  const result = paginatedResponseSchema(itemSchema).safeParse(payload);

  if (!result.success) {
    throw new InternalApiError(
      "This page received an unexpected response from the API. Please refresh the page.",
      500,
      result.error,
    );
  }

  return result.data;
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
    throw new InternalApiError(getErrorMessage(payload), response.status, payload);
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
