import type { ListAuditLogsQuery } from "@cartura/contracts/audit-logs";

import {
  auditLogsRepository,
  type AuditLogsRepository,
} from "./audit-logs.repository.js";

export class AuditLogsService {
  constructor(
    private readonly repository: AuditLogsRepository = auditLogsRepository,
  ) {}

  list(query: ListAuditLogsQuery) {
    return this.repository.list(query);
  }
}

export const auditLogsService = new AuditLogsService();
