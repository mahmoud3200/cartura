import { z } from "zod";

export const paginationQuerySchema = z.preprocess((value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const query = value as Record<string, unknown>;

  return {
    ...query,
    limit: query.limit ?? query.pageSize,
  };
}, z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
}));

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export const paginationMetadataSchema = z.object({
  page: z.number(),
  limit: z.number(),
  totalItems: z.number(),
  totalPages: z.number(),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
});

export function paginatedResponseSchema<T extends z.ZodType>(itemSchema: T) {
  return z.object({
    data: z.array(itemSchema),
    pagination: paginationMetadataSchema,
  });
}

export function dataResponseSchema<T extends z.ZodType>(schema: T) {
  return z.object({ data: schema });
}

export function dataListResponseSchema<T extends z.ZodType>(itemSchema: T) {
  return dataResponseSchema(z.array(itemSchema));
}

export type PaginationMetadata = z.infer<typeof paginationMetadataSchema>;

export const apiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
  requestId: z.string().optional(),
});

export type ApiError = z.infer<typeof apiErrorSchema>;
