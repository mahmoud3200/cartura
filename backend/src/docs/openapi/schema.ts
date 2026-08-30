import { z, type ZodType } from "zod";

type OpenApiSchema = Record<string, unknown>;

/**
 * Converts the runtime contract into the OpenAPI 3.1 JSON Schema dialect.
 * Request schemas use their pre-transform shape, which is what clients send.
 */
export function toOpenApiSchema(
  schema: ZodType,
  io: "input" | "output" = "input",
): OpenApiSchema {
  const jsonSchema = z.toJSONSchema(schema, {
    io,
    reused: "inline",
    unrepresentable: "any",
  }) as OpenApiSchema;

  delete jsonSchema.$schema;
  return jsonSchema;
}
