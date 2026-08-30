import { Router } from "express";
import {
  mutationRateLimit,
  readRateLimit,
} from "../../shared/middleware/rate-limit.js";

import { requireAuthentication } from "../auth/auth.middleware.js";
import { cartController } from "./cart.controller.js";

export const cartRouter = Router();

cartRouter.use(requireAuthentication);

cartRouter.get("/", readRateLimit, cartController.getCart);
cartRouter.post("/items", mutationRateLimit, cartController.addItem);
cartRouter.patch("/items/:productId", mutationRateLimit, cartController.updateItem);
cartRouter.delete("/items/:productId", mutationRateLimit, cartController.removeItem);
cartRouter.delete("/", mutationRateLimit, cartController.clearCart);
