import { z } from "zod";

import { validationError } from "../errors/index.js";

export function parseInput<TSchema extends z.ZodType>(
  schema: TSchema,
  input: unknown,
): z.infer<TSchema> {
  const result = schema.safeParse(input);

  if (!result.success) {
    throw validationError(z.treeifyError(result.error));
  }

  return result.data;
}
