import { z } from "zod";

export const RATE_LIMIT_EXCEEDED_CODE = "RATE_LIMIT_EXCEEDED" as const;
export const CARTURA_BFF_AUTHORIZATION_HEADER =
  "x-cartura-bff-authorization" as const;
export const CARTURA_CLIENT_IP_HEADER = "x-cartura-client-ip" as const;

const paginationQueryShape = {
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
};

function normalizePaginationAlias(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const query = value as Record<string, unknown>;
  const { pageSize, ...queryWithoutAlias } = query;

  return {
    ...queryWithoutAlias,
    limit: query.limit ?? pageSize,
  };
}

export const paginationQuerySchema = z.preprocess(
  normalizePaginationAlias,
  z.object(paginationQueryShape).strict(),
);

export function paginatedQuerySchema<TShape extends z.ZodRawShape>(
  shape: TShape,
) {
  return z.preprocess(
    normalizePaginationAlias,
    z.object({ ...paginationQueryShape, ...shape }).strict(),
  );
}

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export const paginationMetadataSchema = z.object({
  page: z.number(),
  limit: z.number(),
  totalItems: z.number(),
  totalPages: z.number(),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
}).strict();

export function paginatedResponseSchema<T extends z.ZodType>(itemSchema: T) {
  return z.object({
    data: z.array(itemSchema),
    pagination: paginationMetadataSchema,
  }).strict();
}

export function dataResponseSchema<T extends z.ZodType>(schema: T) {
  return z.object({ data: schema }).strict();
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
}).strict();

export type ApiError = z.infer<typeof apiErrorSchema>;

export const apiErrorResponseSchema = z.object({
  error: apiErrorSchema,
}).strict();

export const rateLimitExceededErrorResponseSchema = apiErrorResponseSchema.extend({
  error: apiErrorSchema.extend({
    code: z.literal(RATE_LIMIT_EXCEEDED_CODE),
  }),
});

export const healthResponseSchema = z.object({
  status: z.literal("ok"),
  timestamp: z.iso.datetime(),
}).strict();

export const apiInfoResponseSchema = dataResponseSchema(
  z.object({
    name: z.literal("Cartura API"),
    version: z.literal("v1"),
  }).strict(),
);

export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>;
export type RateLimitExceededErrorResponse = z.infer<
  typeof rateLimitExceededErrorResponseSchema
>;
export type HealthResponse = z.infer<typeof healthResponseSchema>;
export type ApiInfoResponse = z.infer<typeof apiInfoResponseSchema>;
