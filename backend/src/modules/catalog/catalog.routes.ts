import { Router } from "express";

import {
  categoriesRouter,
  managementCategoriesRouter,
} from "./categories/index.js";
import {
  managementProductsRouter,
  productsRouter,
} from "./products/index.js";

export const catalogRouter = Router();
export const managementCatalogRouter = Router();

catalogRouter.use("/categories", categoriesRouter);
catalogRouter.use("/products", productsRouter);

managementCatalogRouter.use("/categories", managementCategoriesRouter);
managementCatalogRouter.use("/products", managementProductsRouter);
