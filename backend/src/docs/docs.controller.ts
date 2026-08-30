import type { RequestHandler } from "express";

import { openApiDocument } from "./openapi.js";
import { createSwaggerHtml } from "./swagger-ui.js";

export class DocsController {
  readonly openApi: RequestHandler = (_req, res) => {
    res.status(200).json(openApiDocument);
  };

  readonly swaggerUi: RequestHandler = (_req, res) => {
    res.type("html").send(createSwaggerHtml("/openapi.json"));
  };
}

export const docsController = new DocsController();
