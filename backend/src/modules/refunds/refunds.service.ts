import type {
  ConfirmRefundItemReceivedRequest,
  CreateRefundRequest,
  ListRefundsQuery,
  ReviewRefundRequest,
} from "@cartura/contracts/refunds";

import { paymobClient } from "../../infrastructure/payments/paymob.client.js";
import { conflictError, notFoundError } from "../../shared/errors/index.js";
import type { AuditContext } from "../audit-logs/audit-logs.types.js";
import { throwRefundPersistenceError } from "./refunds.errors.js";
import {
  refundsRepository,
  type RefundsRepository,
} from "./refunds.repository.js";
import {
  canExecuteRefund,
  createCashRefundResult,
  getRefundMethod,
  isReturnRequestWithinEligibilityWindow,
  requiresProviderTransaction,
} from "./refunds.policy.js";

export class RefundsService {
  constructor(
    private readonly repository: RefundsRepository = refundsRepository,
    private readonly provider: Pick<
      typeof paymobClient,
      "refundTransaction"
    > = paymobClient,
  ) {}

  list(query: ListRefundsQuery) {
    return this.repository.list(query);
  }

  listForUser(userId: string, query: ListRefundsQuery) {
    return this.repository.list(query, userId);
  }

  async requestReturn(
    userId: string,
    input: CreateRefundRequest,
    audit?: AuditContext,
  ) {
    const order = await this.repository.findOrderForRequest(userId, input.orderId);

    if (!order) {
      throw notFoundError("ORDER_NOT_FOUND", "Order not found");
    }
    if (order.status !== "completed" || !order.completedAt) {
      throw conflictError(
        "ORDER_NOT_RETURNABLE",
        "Returns can only be requested after an order is completed",
      );
    }
    const latestRejectedRefund = order.payment?.refunds.find(
      (refund) => refund.status === "rejected",
    );

    if (
      !isReturnRequestWithinEligibilityWindow({
        completedAt: order.completedAt,
        latestRejectedAt:
          latestRejectedRefund?.reviewedAt ?? latestRejectedRefund?.updatedAt,
      })
    ) {
      throw conflictError(
        "REFUND_WINDOW_EXPIRED",
        "The return request window for this order has expired",
      );
    }
    if (!order.payment || order.payment.status !== "paid") {
      throw conflictError(
        "PAYMENT_NOT_REFUNDABLE",
        "This order does not have a paid payment to refund",
      );
    }
    const payment = order.payment;

    const remainingAmount = await this.repository.getRemainingRefundAmount(
      payment.id,
    );

    if (remainingAmount.lte(0)) {
      throw conflictError(
        "REFUND_ALREADY_REQUESTED",
        "This order has already been returned or refunded",
      );
    }

    return withRefundPersistenceErrors(() =>
      this.repository.createRequested({
        userId,
        request: input,
        paymentId: payment.id,
        amount: remainingAmount,
        currency: payment.currency,
        refundMethod: getRefundMethod(payment.paymentMethod),
        ...(audit ? { audit } : {}),
      }),
    );
  }

  async review(
    refundId: string,
    input: ReviewRefundRequest,
    reviewerId: string,
    audit?: AuditContext,
  ) {
    const refund = await this.get(refundId);

    if (refund.status !== "requested") {
      throw conflictError(
        "REFUND_ALREADY_REVIEWED",
        "Only requested returns can be reviewed",
      );
    }
    if (
      input.decision === "approve" &&
      input.resolution === "pickup" &&
      new Date(input.pickupScheduledAt!).getTime() <= Date.now()
    ) {
      throw conflictError(
        "REFUND_PICKUP_DATE_INVALID",
        "The pickup date must be in the future",
      );
    }

    return withRefundPersistenceErrors(() =>
      this.repository.review(refund, input, reviewerId, audit),
    );
  }

  async confirmItemReceived(
    refundId: string,
    input: ConfirmRefundItemReceivedRequest,
    actorId: string,
    audit?: AuditContext,
  ) {
    const refund = await this.get(refundId);

    if (refund.status !== "pickup_scheduled" || refund.resolution !== "pickup") {
      throw conflictError(
        "REFUND_ITEM_NOT_RECEIVABLE",
        "Only scheduled pickup returns can be marked received",
      );
    }

    return withRefundPersistenceErrors(() =>
      this.repository.confirmItemReceived(
        refund,
        input.note,
        actorId,
        audit,
      ),
    );
  }

  execute(refundId: string, audit?: AuditContext) {
    return withRefundPersistenceErrors(() =>
      this.executeRefund(refundId, audit),
    );
  }

  private async executeRefund(refundId: string, audit?: AuditContext) {
    const refund = await this.get(refundId);

    if (!canExecuteRefund(refund)) {
      throw conflictError(
        "REFUND_NOT_EXECUTABLE",
        refund.resolution === "pickup"
          ? "The returned item must be received before issuing the refund"
          : "This refund has not been approved",
      );
    }
    if (
      requiresProviderTransaction(refund.refundMethod) &&
      !refund.payment.providerTransactionId
    ) {
      throw conflictError(
        "PAYMENT_TRANSACTION_MISSING",
        "Payment does not have a provider transaction ID",
      );
    }

    const sourceStatus =
      refund.resolution === "pickup" ? "item_received" : "approved";
    const processingRefund = await this.repository.markProcessing(refund.id);

    let response: Awaited<ReturnType<typeof paymobClient.refundTransaction>> |
      ReturnType<typeof createCashRefundResult>;

    try {
      response =
        refund.refundMethod === "cash"
          ? createCashRefundResult(refund.id)
          : await this.provider.refundTransaction({
              transactionId: refund.payment.providerTransactionId!,
              amount: toMinorUnits(refund.amount),
            });

    } catch (error) {
      if (isPaymobRefundConfigurationError(error)) {
        await this.repository.resetExecution(refund.id, sourceStatus);
        throw error;
      }

      return this.repository.recordExecutionUncertainty(
        processingRefund,
        getErrorMessage(error),
        audit,
      );
    }

    if (response.success === false) {
      return this.repository.fail(
        processingRefund,
        stringValue(response.message) ||
          stringValue(response.detail) ||
          "Paymob refund was rejected",
        audit,
      );
    }

    const providerRefundId = getProviderRefundId(response);

    if (response.pending === true) {
      return this.repository.markProviderPending(
        processingRefund,
        providerRefundId,
        audit,
      );
    }

    try {
      return await this.repository.complete(
        processingRefund,
        providerRefundId,
        audit,
      );
    } catch (error) {
      try {
        return await this.repository.recordExecutionUncertainty(
          processingRefund,
          "The provider reported success, but Cartura could not confirm local completion. Manual reconciliation is required.",
          audit,
        );
      } catch {
        throw error;
      }
    }
  }

  findProcessingPaymobRefund(paymentId: string) {
    return this.repository.findProcessingForPayment(paymentId);
  }

  completePaymobRefundCallback(
    refund: Awaited<ReturnType<RefundsRepository["findProcessingForPayment"]>>,
    providerRefundId: string,
    eventClaim: { eventId: string; claimToken: string },
  ) {
    if (!refund) {
      throw notFoundError(
        "REFUND_NOT_FOUND",
        "No processing card refund matches this payment",
      );
    }

    return withRefundPersistenceErrors(() =>
      this.repository.complete(
        refund,
        refund.providerRefundId ?? providerRefundId,
        { actorType: "provider" },
        eventClaim,
      ),
    );
  }

  private async get(refundId: string) {
    const refund = await this.repository.findById(refundId);

    if (!refund) {
      throw notFoundError("REFUND_NOT_FOUND", "Refund not found");
    }

    return refund;
  }
}

function toMinorUnits(value: number | { toString(): string }): number {
  return Math.round(Number(value) * 100);
}

function getProviderRefundId(response: Record<string, unknown>): string | null {
  return (
    stringValue(response.id) ||
    stringValue(response.transaction_id) ||
    stringValue(response.refund_id) ||
    null
  );
}

function stringValue(value: unknown): string {
  return value === null || value === undefined ? "" : String(value);
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Refund execution failed";
}

function isPaymobRefundConfigurationError(error: unknown): boolean {
  return (
    error !== null &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code?: unknown }).code === "PAYMOB_REFUND_NOT_CONFIGURED"
  );
}

async function withRefundPersistenceErrors<T>(
  operation: () => Promise<T>,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    throwRefundPersistenceError(error);
  }
}

export const refundsService = new RefundsService();
