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

export type PaymobIntentionResponse = {
  id: string;
  client_secret: string;
  intention_order_id: number;
  payment_keys?: Array<{
    order_id?: number;
    integration?: number;
    key?: string;
    gateway_type?: string;
  }>;
  status?: string;
  special_reference?: string;
};

export type CreatePaymobRefundInput = {
  transactionId: string;
  amount: number;
};

export type PaymobRefundResponse = {
  id?: string | number;
  transaction_id?: string | number;
  success?: boolean;
  pending?: boolean;
  message?: string;
  detail?: string;
  [key: string]: unknown;
};
