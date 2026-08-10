import type { RequestHandler } from "express";
import { fromNodeHeaders } from "better-auth/node";

import { unauthenticatedError } from "../../shared/errors/index.js";
import {
  getOptionalAuthenticatedUserId,
  setAuthenticatedPrincipal,
} from "../../shared/utils/request.utils.js";
import { usersService } from "../users/users.service.js";
import { auth } from "./better-auth.js";

export const rejectRestrictedAccount: RequestHandler = async (
  req,
  _res,
  next,
) => {
  try {
    const session = await getRequestSession(req);

    if (!session) {
      next();
      return;
    }

    await assertSessionAccountCanAccess(req, session);
    next();
  } catch (error) {
    next(error);
  }
};

export const requireAuthentication: RequestHandler = async (req, _res, next) => {
  try {
    if (getOptionalAuthenticatedUserId(req)) {
      next();
      return;
    }

    const session = await getRequestSession(req);

    if (!session) {
      next(unauthenticatedError());
      return;
    }

    await assertSessionAccountCanAccess(req, session);
    next();
  } catch (error) {
    next(error);
  }
};

async function getRequestSession(req: Parameters<RequestHandler>[0]) {
  return auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });
}

async function assertSessionAccountCanAccess(
  req: Parameters<RequestHandler>[0],
  session: NonNullable<Awaited<ReturnType<typeof getRequestSession>>>,
) {
  await usersService.assertAccountCanAccess(session.user.id);
  setAuthenticatedPrincipal(req, {
    userId: session.user.id,
    sessionId: session.session.id,
  });
}
