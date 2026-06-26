import type { RequestHandler } from "express";
import { fromNodeHeaders } from "better-auth/node";

import { auth } from "./better-auth.js";
import type { AuthenticatedRequest } from "./auth.types.js";

export const requireAuthentication: RequestHandler = async (req, res, next) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      res.status(401).json({
        error: {
          code: "UNAUTHENTICATED",
          message: "Authentication is required",
        },
      });
      return;
    }

    (req as AuthenticatedRequest).principal = {
      userId: session.user.id,
      sessionId: session.session.id,
    };

    next();
  } catch (error) {
    next(error);
  }
};
