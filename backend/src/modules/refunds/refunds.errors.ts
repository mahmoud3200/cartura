import { conflictError } from "../../shared/errors/index.js";
import { RefundPersistenceConflictError } from "./refunds.persistence-errors.js";

export function throwRefundPersistenceError(error: unknown): never {
  if (!(error instanceof RefundPersistenceConflictError)) {
    throw error;
  }

  switch (error.kind) {
    case "active_request":
      throw conflictError(
        "REFUND_ALREADY_REQUESTED",
        "This order already has an active return or refund",
      );
    case "request_concurrent":
      throw conflictError(
        "REFUND_REQUEST_CONFLICT",
        "The refund request changed concurrently; reload and try again",
      );
    case "already_reviewed":
      throw conflictError(
        "REFUND_ALREADY_REVIEWED",
        "This return request has already been reviewed",
      );
    case "item_not_receivable":
      throw conflictError(
        "REFUND_ITEM_NOT_RECEIVABLE",
        "This return is not waiting for a pickup",
      );
    case "not_executable":
      throw conflictError(
        "REFUND_NOT_EXECUTABLE",
        "This refund is not ready to be issued",
      );
    case "not_processing":
      throw conflictError(
        "REFUND_NOT_PROCESSING",
        "This refund is no longer processing",
      );
    case "webhook_claim_lost":
      throw conflictError(
        "PAYMENT_WEBHOOK_CLAIM_LOST",
        "The payment webhook claim is no longer active",
      );
    case "completion_concurrent":
      throw conflictError(
        "REFUND_COMPLETION_CONFLICT",
        "The payment changed while the refund was being completed",
      );
  }
}

