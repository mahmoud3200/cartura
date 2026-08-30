import { signUpEmailRequestSchema } from "@cartura/contracts/auth";
import type { RequestHandler } from "express";

import { parseInput } from "../../shared/validation/parse-input.js";

export const normalizeEmailSignUpRequest: RequestHandler = async (
  req,
  _res,
  next,
) => {
  try {
    req.body = normalizeEmailSignUpBody(req.body);
    next();
  } catch (error) {
    next(error);
  }
};

export function normalizeEmailSignUpBody(input: unknown) {
  const body = parseInput(signUpEmailRequestSchema, input);

  return {
    ...body,
    name: `${body.firstName} ${body.lastName}`.trim(),
  };
}
