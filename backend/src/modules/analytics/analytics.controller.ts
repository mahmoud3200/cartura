import type { RequestHandler } from "express";

import { parseInput } from "../../shared/validation/parse-input.js";
import { mapAnalyticsOverview } from "./analytics.mapper.js";
import { analyticsOverviewQuerySchema } from "./analytics.schemas.js";
import { analyticsService } from "./analytics.service.js";

export class AnalyticsController {
  overview: RequestHandler = async (req, res, next) => {
    try {
      const query = parseInput(analyticsOverviewQuerySchema, req.query);
      const overview = await analyticsService.getOverview(query);

      res.status(200).json({
        data: mapAnalyticsOverview(overview),
      });
    } catch (error) {
      next(error);
    }
  };
}

export const analyticsController = new AnalyticsController();
