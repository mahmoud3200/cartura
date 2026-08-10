import type { RequestHandler } from "express";
import { routeNotFoundError } from "../errors/index.js";

export const notFound: RequestHandler = (req, _res, next) => {
  next(routeNotFoundError(req.method, req.originalUrl));
};
