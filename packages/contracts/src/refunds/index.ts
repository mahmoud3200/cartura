import { z } from "zod";

import {
  dataResponseSchema,
  paginatedQuerySchema,
  paginatedResponseSchema,
} from "../common/index.js";
import {
  orderAddressSchema,
  orderCurrencySchema,
  orderStatusSchema,
  paymentMethodSchema,
} from "../orders/index.js";
import { paymentRecordStatusSchema } from "../payments/index.js";

export const REFUND_WINDOW_DAYS = 14;

export const refundReasonSchema = z.enum([
  "damaged",
  "defective",
  "wrong_item",
  "not_as_described",
  "changed_mind",
  "other",
]);
export const REFUND_REASONS = refundReasonSchema.options;

export const refundStatusSchema = z.enum([
  "requested",
  "approved",
  "rejected",
  "pickup_scheduled",
  "item_received",
  "processing",
  "completed",
  "failed",
]);
export const REFUND_STATUSES = refundStatusSchema.options;

export const refundResolutionSchema = z.enum(["pickup", "keep_item"]);
export const refundMethodSchema = z.enum(["card", "cash"]);

export const createRefundRequestSchema = z.object({
  orderId: z.uuid(),
  reason: refundReasonSchema,
  note: z.string().trim().min(1).max(1000).optional(),
}).strict();

const approveRefundRequestSchema = z
  .object({
    decision: z.literal("approve"),
    resolution: refundResolutionSchema,
    reviewNote: z.string().trim().min(1).max(1000).optional(),
    pickupScheduledAt: z.iso.datetime().optional(),
  })
  .strict()
  .superRefine((input, context) => {
    if (input.resolution === "pickup" && !input.pickupScheduledAt) {
      context.addIssue({
        code: "custom",
        path: ["pickupScheduledAt"],
        message: "Choose a pickup date and time",
      });
    }
    if (input.resolution === "keep_item" && input.pickupScheduledAt) {
      context.addIssue({
        code: "custom",
        path: ["pickupScheduledAt"],
        message: "Keep-item refunds cannot have a pickup date",
      });
    }
  });

const rejectRefundRequestSchema = z.object({
  decision: z.literal("reject"),
  reviewNote: z.string().trim().min(1).max(1000),
}).strict();

export const reviewRefundRequestSchema = z.discriminatedUnion("decision", [
  approveRefundRequestSchema,
  rejectRefundRequestSchema,
]);

export const confirmRefundItemReceivedRequestSchema = z.object({
  note: z.string().trim().min(1).max(1000).optional(),
}).strict();

export const listRefundsQuerySchema = paginatedQuerySchema({
  status: refundStatusSchema.optional(),
  paymentId: z.uuid().optional(),
  orderId: z.uuid().optional(),
});

export const refundIdParamsSchema = z.object({ refundId: z.uuid() }).strict();

export const managementRefundSchema = z.object({
  id: z.uuid(),
  paymentId: z.uuid(),
  initiatedBy: z.uuid().nullable(),
  reviewedBy: z.uuid().nullable(),
  providerRefundId: z.string().nullable(),
  amount: z.number(),
  currency: orderCurrencySchema,
  status: refundStatusSchema,
  reasonCode: refundReasonSchema.nullable(),
  customerNote: z.string().nullable(),
  reviewNote: z.string().nullable(),
  resolution: refundResolutionSchema.nullable(),
  refundMethod: refundMethodSchema,
  failureReason: z.string().nullable(),
  eligibilityExpiresAt: z.iso.datetime(),
  pickupScheduledAt: z.iso.datetime().nullable(),
  itemReceivedAt: z.iso.datetime().nullable(),
  reviewedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  completedAt: z.iso.datetime().nullable(),
  failedAt: z.iso.datetime().nullable(),
  order: z.object({
    id: z.uuid(),
    orderNumber: z.string(),
    status: orderStatusSchema,
    completedAt: z.iso.datetime().nullable(),
    address: orderAddressSchema.nullable(),
  }),
  customer: z.object({
    id: z.uuid(),
    name: z.string(),
    email: z.email(),
  }),
  payment: z.object({
    method: paymentMethodSchema,
    status: paymentRecordStatusSchema,
  }),
});

// Customer responses intentionally exclude provider identifiers, raw execution
// failures, and staff identity fields. Those details remain management-only.
export const customerRefundSchema = managementRefundSchema.omit({
  initiatedBy: true,
  reviewedBy: true,
  providerRefundId: true,
  failureReason: true,
});

export const refundSchema = managementRefundSchema;

export const refundDataResponseSchema = dataResponseSchema(customerRefundSchema);
export const paginatedRefundListResponseSchema =
  paginatedResponseSchema(customerRefundSchema);
export const managementRefundDataResponseSchema = dataResponseSchema(
  managementRefundSchema,
);
export const paginatedManagementRefundListResponseSchema =
  paginatedResponseSchema(managementRefundSchema);

export type RefundReason = z.infer<typeof refundReasonSchema>;
export type RefundIdParams = z.infer<typeof refundIdParamsSchema>;
export type RefundStatus = z.infer<typeof refundStatusSchema>;
export type RefundResolution = z.infer<typeof refundResolutionSchema>;
export type RefundMethod = z.infer<typeof refundMethodSchema>;
export type CreateRefundRequest = z.infer<typeof createRefundRequestSchema>;
export type ReviewRefundRequest = z.infer<typeof reviewRefundRequestSchema>;
export type ConfirmRefundItemReceivedRequest = z.infer<
  typeof confirmRefundItemReceivedRequestSchema
>;
export type ListRefundsQuery = z.infer<typeof listRefundsQuerySchema>;
export type ManagementRefund = z.infer<typeof managementRefundSchema>;
/** @deprecated Use ManagementRefund for staff-facing refund data. */
export type Refund = ManagementRefund;
export type CustomerRefund = z.infer<typeof customerRefundSchema>;
