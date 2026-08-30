import { getActionRateLimitMetadata } from "@/shared/lib/action-rate-limit";
import type { ActionRateLimitMetadata } from "@/shared/types";

export type ManagementActionResult<T> =
  | { ok: true; data: T }
  | ({ ok: false; message: string } & ActionRateLimitMetadata);

export function managementActionFailure(
  error: unknown,
): ManagementActionResult<never> {
  return {
    ok: false,
    message:
      error instanceof Error
        ? error.message
        : "The request could not be completed.",
    ...getActionRateLimitMetadata(error),
  };
}

export function unwrapManagementAction<T>(result: ManagementActionResult<T>) {
  if (!result.ok) {
    throw new Error(result.message);
  }

  return result.data;
}
