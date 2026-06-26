import { Router } from "express";

import { requireAuthentication } from "../auth/index.js";
import { cartController } from "./cart.controller.js";

export const cartRouter = Router();

cartRouter.use(requireAuthentication);

cartRouter.get("/", cartController.getCart);
cartRouter.post("/items", cartController.addItem);
cartRouter.patch("/items/:productId", cartController.updateItem);
cartRouter.delete("/items/:productId", cartController.removeItem);
cartRouter.delete("/", cartController.clearCart);
