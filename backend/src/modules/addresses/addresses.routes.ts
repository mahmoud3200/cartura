import { Router } from "express";

import { requireAuthentication } from "../auth/auth.middleware.js";
import { addressesController } from "./addresses.controller.js";

export const addressesRouter = Router();

addressesRouter.use(requireAuthentication);

addressesRouter.get("/", addressesController.list);
addressesRouter.post("/", addressesController.create);
addressesRouter.get("/:addressId", addressesController.getById);
addressesRouter.patch("/:addressId", addressesController.update);
addressesRouter.patch("/:addressId/default", addressesController.setDefault);
addressesRouter.delete("/:addressId", addressesController.delete);
