import { toNodeHandler } from "better-auth/node";
import type { RequestHandler } from "express";

import { auth } from "./better-auth.js";
import { isAuthRestrictionExemptPath } from "./auth-route.policy.js";
import { rejectRestrictedAccount } from "./auth.middleware.js";

const betterAuthNodeHandler = toNodeHandler(auth);

export const authNodeHandler: RequestHandler = (req, res, next) => {
  const handle = () => {
    void betterAuthNodeHandler(req, res).catch(next);
  };

  if (isAuthRestrictionExemptPath(req.path)) {
    handle();
    return;
  }

  rejectRestrictedAccount(req, res, (error) => {
    if (error) {
      next(error);
      return;
    }

    handle();
  });
};
