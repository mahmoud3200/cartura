import type { Request } from "express";

import { unauthenticatedError } from "../errors/index.js";
import type {
  AuthenticatedRequest,
  Principal,
} from "../types/authenticated-request.js";

export function getAuthenticatedUserId(req: Request): string {
  const userId = getOptionalAuthenticatedUserId(req);

  if (!userId) {
    throw unauthenticatedError();
  }

  return userId;
}

export function getOptionalAuthenticatedUserId(
  req: Request,
): string | undefined {
  return (req as AuthenticatedRequest).principal?.userId;
}

export function setAuthenticatedPrincipal(
  req: Request,
  principal: Principal,
): void {
  (req as AuthenticatedRequest).principal = principal;
}

export function getPathParam(
  value: string | string[] | undefined,
): string {
  return typeof value === "string" ? value : "";
}
