import { signUpEmailRequestSchema } from "@cartura/contracts/auth";
import { fromNodeHeaders } from "better-auth/node";
import type { RequestHandler } from "express";

import { parseInput } from "../../shared/validation/parse-input.js";
import { auth } from "./better-auth.js";

export const signUpWithEmail: RequestHandler = async (req, res, next) => {
  try {
    const body = parseInput(signUpEmailRequestSchema, req.body);
    const name = `${body.firstName} ${body.lastName}`.trim();
    const result = await auth.api.signUpEmail({
      body: {
        name,
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        password: body.password,
        ...(body.image !== undefined ? { image: body.image } : {}),
        ...(body.callbackURL !== undefined
          ? { callbackURL: body.callbackURL }
          : {}),
        ...(body.rememberMe !== undefined ? { rememberMe: body.rememberMe } : {}),
      },
      headers: fromNodeHeaders(req.headers),
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
