import { z } from "zod";

import {
  dataResponseSchema,
  paginatedResponseSchema,
  paginationQuerySchema,
} from "../common/index.js";
import { orderAddressSchema } from "../orders/index.js";

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
});

const approveRefundRequestSchema = z
  .object({
    decision: z.literal("approve"),
    resolution: refundResolutionSchema,
    reviewNote: z.string().trim().min(1).max(1000).optional(),
    pickupScheduledAt: z.iso.datetime().optional(),
  })
  .superRefine((input, context) => {
    if (input.resolution === "pickup" && !input.pickupScheduledAt) {
      context.addIssue({
        code: "custom",
        path: ["pickupScheduledAt"],
        message: "Choose a pickup date and time",
      });
    }
  });

const rejectRefundRequestSchema = z.object({
  decision: z.literal("reject"),
  reviewNote: z.string().trim().min(1).max(1000),
});

export const reviewRefundRequestSchema = z.discriminatedUnion("decision", [
  approveRefundRequestSchema,
  rejectRefundRequestSchema,
]);

export const confirmRefundItemReceivedRequestSchema = z.object({
  note: z.string().trim().min(1).max(1000).optional(),
});

export const listRefundsQuerySchema = z.intersection(
  paginationQuerySchema,
  z.object({
    status: refundStatusSchema.optional(),
    paymentId: z.uuid().optional(),
    orderId: z.uuid().optional(),
  }),
);

export const refundSchema = z.object({
  id: z.string(),
  paymentId: z.string(),
  initiatedBy: z.string().nullable(),
  reviewedBy: z.string().nullable(),
  providerRefundId: z.string().nullable(),
  amount: z.number(),
  currency: z.string(),
  status: refundStatusSchema,
  reasonCode: refundReasonSchema.nullable(),
  customerNote: z.string().nullable(),
  reviewNote: z.string().nullable(),
  resolution: refundResolutionSchema.nullable(),
  refundMethod: refundMethodSchema,
  failureReason: z.string().nullable(),
  eligibilityExpiresAt: z.string(),
  pickupScheduledAt: z.string().nullable(),
  itemReceivedAt: z.string().nullable(),
  reviewedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  completedAt: z.string().nullable(),
  failedAt: z.string().nullable(),
  order: z.object({
    id: z.string(),
    orderNumber: z.string(),
    status: z.string(),
    completedAt: z.string().nullable(),
    address: orderAddressSchema.nullable(),
  }),
  customer: z.object({
    id: z.string(),
    name: z.string(),
    email: z.email(),
  }),
  payment: z.object({
    method: z.string(),
    status: z.string(),
  }),
});

export const refundDataResponseSchema = dataResponseSchema(refundSchema);
export const paginatedRefundListResponseSchema =
  paginatedResponseSchema(refundSchema);

export type RefundReason = z.infer<typeof refundReasonSchema>;
export type RefundStatus = z.infer<typeof refundStatusSchema>;
export type RefundResolution = z.infer<typeof refundResolutionSchema>;
export type RefundMethod = z.infer<typeof refundMethodSchema>;
export type CreateRefundRequest = z.infer<typeof createRefundRequestSchema>;
export type ReviewRefundRequest = z.infer<typeof reviewRefundRequestSchema>;
export type ConfirmRefundItemReceivedRequest = z.infer<
  typeof confirmRefundItemReceivedRequestSchema
>;
export type ListRefundsQuery = z.infer<typeof listRefundsQuerySchema>;
export type Refund = z.infer<typeof refundSchema>;
