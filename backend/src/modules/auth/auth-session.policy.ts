import { APIError } from "better-auth";

import { toHttpError } from "../../shared/errors/index.js";

export async function assertSessionCreationAllowed(
  userId: string,
  assertAccountCanAccess: (userId: string) => Promise<void>,
): Promise<void> {
  try {
    await assertAccountCanAccess(userId);
  } catch (error) {
    const accountError = toHttpError(error);

    if (accountError?.statusCode === 403) {
      throw new APIError("FORBIDDEN", {
        message: accountError.message,
      });
    }

    throw error;
  }
}
