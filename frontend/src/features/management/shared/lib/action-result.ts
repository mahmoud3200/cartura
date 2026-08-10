export type ManagementActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string };

export function managementActionFailure(
  error: unknown,
): ManagementActionResult<never> {
  return {
    ok: false,
    message:
      error instanceof Error
        ? error.message
        : "The request could not be completed.",
  };
}

export function unwrapManagementAction<T>(result: ManagementActionResult<T>) {
  if (!result.ok) {
    throw new Error(result.message);
  }

  return result.data;
}
