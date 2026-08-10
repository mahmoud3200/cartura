import type { ListAuditLogsQuery } from "@cartura/contracts/audit-logs";

import {
  auditLogsRepository,
  type AuditLogsRepository,
} from "./audit-logs.repository.js";
import type { RecordAuditLogInput } from "./audit-logs.types.js";

export class AuditLogsService {
  constructor(
    private readonly repository: AuditLogsRepository = auditLogsRepository,
  ) {}

  list(query: ListAuditLogsQuery) {
    return this.repository.list(query);
  }

  record(input: RecordAuditLogInput) {
    return this.repository.create(input);
  }
}

export const auditLogsService = new AuditLogsService();
