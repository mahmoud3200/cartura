import type { AccountRestriction } from "@cartura/contracts/auth";

import {
  httpError,
  notFoundError as sharedNotFoundError,
} from "../../shared/errors/index.js";

export function userHttpError(
  statusCode: number,
  code: string,
  message: string,
  details?: unknown,
): Error {
  return httpError(statusCode, code, message, details);
}

export function cantBanSuperAdminError(
  message = "The configured super admin account cannot be suspended or disabled",
) {
  return userHttpError(403, "SUPER_ADMIN_ACCOUNT_PROTECTED", message);
}

export function cantSelfBanError(
  message = "You cannot suspended or ban yourself",
) {
  return userHttpError(403, "CANT_SUSPEND_OR_BAN_YOURSELF", message);
}

export function notFoundError() {
  return sharedNotFoundError("USER_NOT_FOUND", "User not found");
}

export function accountSuspendedError(
  details: AccountRestriction & { accountStatus: "suspended" },
) {
  return userHttpError(
    403,
    "ACCOUNT_SUSPENDED",
    "Your account is suspended",
    details,
  );
}

export function accountDisabledError(
  details: AccountRestriction & { accountStatus: "disabled" },
) {
  return userHttpError(
    403,
    "ACCOUNT_DISABLED",
    "Your account is disabled",
    details,
  );
}
