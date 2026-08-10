import "server-only";

import {
  dataResponseSchema,
  paginatedResponseSchema,
} from "@cartura/contracts/common";
import { z } from "zod";

import { serverApiFetch } from "@/shared/api/server-api";

export type ManagementPaginationInput = {
  page?: number;
  limit: number;
};

export async function fetchManagementPaginated<T extends z.ZodType>(
  path: string,
  itemSchema: T,
  pagination: ManagementPaginationInput | number,
  searchParams: Record<string, string | undefined> = {},
) {
  const page =
    typeof pagination === "number" ? 1 : Math.max(1, pagination.page ?? 1);
  const limit = typeof pagination === "number" ? pagination : pagination.limit;
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  for (const [key, value] of Object.entries(searchParams)) {
    if (value) {
      params.set(key, value);
    }
  }

  const payload = await serverApiFetch<unknown>(
    `${path}?${params.toString()}`,
    { forwardCookies: true },
  );

  return paginatedResponseSchema(itemSchema).parse(payload);
}

export async function fetchManagementData<T extends z.ZodType>(
  path: string,
  schema: T,
  init?: Parameters<typeof serverApiFetch>[1],
): Promise<z.output<T>> {
  const payload = await serverApiFetch<unknown>(path, {
    forwardCookies: true,
    ...init,
  });

  const result = dataResponseSchema(schema).parse(payload) as {
    data: z.output<T>;
  };

  return result.data;
}
