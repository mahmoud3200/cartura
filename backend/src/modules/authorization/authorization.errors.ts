import { httpError } from "../../shared/errors/index.js";

export function cantChangeOwnRoleError() {
  return httpError(
    403,
    "SELF_ROLE_CHANGE_FORBIDDEN",
    "You cannot change your own role",
  );
}

export function cantChangeProtectedUserRoleError() {
  return httpError(
    403,
    "PROTECTED_USER_ROLE_CHANGE_FORBIDDEN",
    "You cannot change this user's role",
  );
}
