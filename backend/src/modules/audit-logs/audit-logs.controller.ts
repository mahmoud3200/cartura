import type { RequestHandler } from "express";

import { mapPaginatedResult } from "../../shared/pagination/pagination.js";
import { parseInput } from "../../shared/validation/parse-input.js";
import { mapAuditLog } from "./audit-logs.mapper.js";
import { listAuditLogsQuerySchema } from "./audit-logs.schemas.js";
import { auditLogsService } from "./audit-logs.service.js";

export class AuditLogsController {
  list: RequestHandler = async (req, res, next) => {
    try {
      const query = parseInput(listAuditLogsQuerySchema, req.query);
      const auditLogs = await auditLogsService.list(query);

      res.status(200).json(mapPaginatedResult(auditLogs, mapAuditLog));
    } catch (error) {
      next(error);
    }
  };
}

export const auditLogsController = new AuditLogsController();
