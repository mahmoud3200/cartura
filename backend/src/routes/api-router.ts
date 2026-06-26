import { Router } from "express";

import { authorizationRouter } from "../modules/authorization/index.js";
import { cartRouter } from "../modules/cart/index.js";
import {
  catalogRouter,
  managementCatalogRouter,
} from "../modules/catalog/index.js";

export const apiRouter = Router();

apiRouter.get("/", (_req, res) => {
  res.status(200).json({
    data: {
      name: "Cartura API",
      version: "v1",
    },
  });
});

apiRouter.use("/management/authorization", authorizationRouter);
apiRouter.use("/catalog", catalogRouter);
apiRouter.use("/management/catalog", managementCatalogRouter);
apiRouter.use("/cart", cartRouter);
