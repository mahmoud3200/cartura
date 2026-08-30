import type { ApiInfoResponse, HealthResponse } from "@cartura/contracts/common";
import type { RequestHandler } from "express";

export class SystemController {
  readonly health: RequestHandler = (_req, res) => {
    const response = {
      status: "ok",
      timestamp: new Date().toISOString(),
    } satisfies HealthResponse;

    res.status(200).json(response);
  };

  readonly apiInfo: RequestHandler = (_req, res) => {
    const response = {
      data: {
        name: "Cartura API",
        version: "v1",
      },
    } satisfies ApiInfoResponse;

    res.status(200).json(response);
  };
}

export const systemController = new SystemController();
