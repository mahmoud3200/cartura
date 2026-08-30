import { z } from "zod";

export type PaymobBillingData = {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  country?: string;
  city?: string;
  state?: string;
  street?: string;
  postal_code?: string;
};

export type PaymobIntentionItem = {
  name: string;
  amount: number;
  quantity: number;
  description?: string;
};

export type CreatePaymobIntentionInput = {
  amount: number;
  currency: string;
  paymentMethods: number[];
  items: PaymobIntentionItem[];
  billingData: PaymobBillingData;
  specialReference: string;
  notificationUrl?: string;
  redirectionUrl?: string;
  extras?: Record<string, unknown>;
};

export const paymobIntentionResponseSchema = z.object({
  id: z.string().min(1),
  client_secret: z.string().min(1),
  intention_order_id: z.number().int().positive(),
  payment_keys: z.array(z.object({
    order_id: z.number().int().positive().optional(),
    integration: z.number().int().positive().optional(),
    key: z.string().optional(),
    gateway_type: z.string().optional(),
  })).optional(),
  status: z.string().optional(),
  special_reference: z.string().optional(),
});

export type PaymobIntentionResponse = z.infer<
  typeof paymobIntentionResponseSchema
>;

export type CreatePaymobRefundInput = {
  transactionId: string;
  amount: number;
};

export const paymobRefundResponseSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  transaction_id: z.union([z.string(), z.number()]).optional(),
  refund_id: z.union([z.string(), z.number()]).optional(),
  success: z.boolean().optional(),
  pending: z.boolean().optional(),
  message: z.string().optional(),
  detail: z.string().optional(),
}).passthrough().superRefine((response, context) => {
  if (response.success === undefined && response.pending !== true) {
    context.addIssue({
      code: "custom",
      message: "Paymob refund response has no outcome",
    });
  }
});

export type PaymobRefundResponse = z.infer<typeof paymobRefundResponseSchema>;
