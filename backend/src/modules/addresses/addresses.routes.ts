import { Router } from "express";
import {
  mutationRateLimit,
  readRateLimit,
} from "../../shared/middleware/rate-limit.js";

import { requireAuthentication } from "../auth/auth.middleware.js";
import { addressesController } from "./addresses.controller.js";

export const addressesRouter = Router();

addressesRouter.use(requireAuthentication);

addressesRouter.get("/", readRateLimit, addressesController.list);
addressesRouter.post("/", mutationRateLimit, addressesController.create);
addressesRouter.get("/:addressId", readRateLimit, addressesController.getById);
addressesRouter.patch("/:addressId", mutationRateLimit, addressesController.update);
addressesRouter.patch(
  "/:addressId/default",
  mutationRateLimit,
  addressesController.setDefault,
);
addressesRouter.delete("/:addressId", mutationRateLimit, addressesController.delete);
