export type RefundPersistenceConflictKind =
  | "active_request"
  | "request_concurrent"
  | "already_reviewed"
  | "item_not_receivable"
  | "not_executable"
  | "not_processing"
  | "webhook_claim_lost"
  | "completion_concurrent";

export class RefundPersistenceConflictError extends Error {
  constructor(readonly kind: RefundPersistenceConflictKind) {
    super(`Refund persistence conflict: ${kind}`);
    this.name = "RefundPersistenceConflictError";
  }
}

