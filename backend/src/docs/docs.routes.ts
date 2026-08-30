import { Router } from "express";

import { docsController } from "./docs.controller.js";

export const docsRouter = Router();

docsRouter.get("/openapi.json", docsController.openApi);
docsRouter.get("/docs", docsController.swaggerUi);
