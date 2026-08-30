import {
  addressResponseSchema,
  createAddressRequestSchema,
  updateAddressRequestSchema,
} from "@cartura/contracts/addresses";
import {
  analyticsOverviewResponseSchema,
  analyticsStatusCountSchema,
} from "@cartura/contracts/analytics";
import {
  forgotPasswordRequestSchema,
  loginRequestSchema,
  oauthAuthorizeRequestSchema,
  signUpEmailRequestSchema,
  verifyTwoFactorOtpRequestSchema,
} from "@cartura/contracts/auth";
import {
  auditLogActorSchema,
  auditLogListResponseSchema,
  auditLogSchema,
} from "@cartura/contracts/audit-logs";
import {
  createRoleRequestSchema,
  updateRolePermissionsRequestSchema,
  updateRoleRequestSchema,
  updateUserRoleRequestSchema,
} from "@cartura/contracts/authorization";
import {
  addCartItemRequestSchema,
  updateCartItemRequestSchema,
} from "@cartura/contracts/cart";
import {
  createCategoryRequestSchema,
  createProductRequestSchema,
  productImageInputSchema,
  updateCategoryRequestSchema,
  updateProductInventoryRequestSchema,
  updateProductRequestSchema,
} from "@cartura/contracts/catalog";
import {
  apiErrorResponseSchema,
  apiInfoResponseSchema,
  healthResponseSchema,
} from "@cartura/contracts/common";
import {
  buyNowCheckoutRequestSchema,
  checkoutOrderRequestSchema,
  updateOrderStatusRequestSchema,
} from "@cartura/contracts/orders";
import { paymentWebhookEventSchema } from "@cartura/contracts/payments";
import {
  confirmRefundItemReceivedRequestSchema,
  createRefundRequestSchema,
  reviewRefundRequestSchema,
} from "@cartura/contracts/refunds";
import {
  updateUserStatusRequestSchema,
  userAccountStatusSchema,
} from "@cartura/contracts/users";

import { toOpenApiSchema } from "./schema.js";

export const openApiComponents = {
  securitySchemes: {
    bearerAuth: {
      type: "http",
      scheme: "bearer",
      bearerFormat: "Better Auth session token",
    },
  },
  responses: {
    AuthError: {
      description: "Authentication request failed",
      content: errorResponseContent(),
    },
    ForbiddenError: {
      description: "The current user does not have the required permission",
      content: errorResponseContent(),
    },
    ValidationError: {
      description: "Request validation failed",
      content: errorResponseContent(),
    },
  },
  parameters: {
    RoleId: uuidPathParameter("roleId"),
    UserId: uuidPathParameter("userId"),
    AddressId: uuidPathParameter("addressId"),
    CategoryId: uuidPathParameter("categoryId"),
    ProductId: uuidPathParameter("productId"),
    MediaAssetId: uuidPathParameter("mediaAssetId"),
    OrderId: uuidPathParameter("orderId"),
    PaymentId: uuidPathParameter("paymentId"),
    RefundId: uuidPathParameter("refundId"),
    WebhookEventId: uuidPathParameter("eventId"),
    NotificationId: uuidPathParameter("notificationId"),
    Slug: {
      name: "slug",
      in: "path",
      required: true,
      schema: { type: "string" },
    },
    Page: {
      name: "page",
      in: "query",
      required: false,
      schema: { type: "integer", minimum: 1, default: 1 },
    },
    Limit: {
      name: "limit",
      in: "query",
      required: false,
      schema: { type: "integer", minimum: 1, maximum: 100, default: 20 },
    },
  },
  schemas: {
    ApiErrorResponse: toOpenApiSchema(apiErrorResponseSchema, "output"),
    HealthResponse: toOpenApiSchema(healthResponseSchema, "output"),
    ApiInfoResponse: toOpenApiSchema(apiInfoResponseSchema, "output"),
    BetterAuthSignUpEmail: toOpenApiSchema(signUpEmailRequestSchema),
    BetterAuthSignInEmail: toOpenApiSchema(loginRequestSchema),
    BetterAuthVerifySignInOtp: toOpenApiSchema(
      verifyTwoFactorOtpRequestSchema,
    ),
    BetterAuthSendOtp: {
      type: "object",
      required: ["email", "type"],
      properties: {
        email: { type: "string", format: "email" },
        type: {
          type: "string",
          enum: [
            "email-verification",
            "forget-password",
            "change-email",
          ],
        },
      },
    },
    BetterAuthVerifyEmailOtp: {
      type: "object",
      required: ["email", "otp"],
      properties: {
        email: { type: "string", format: "email" },
        otp: { type: "string", minLength: 6, maxLength: 6 },
      },
    },
    BetterAuthResetPasswordOtp: {
      type: "object",
      required: ["email", "otp", "password"],
      properties: {
        email: { type: "string", format: "email" },
        otp: { type: "string", minLength: 6, maxLength: 6 },
        password: { type: "string", minLength: 8, maxLength: 128 },
      },
    },
    BetterAuthSocialSignIn: toOpenApiSchema(oauthAuthorizeRequestSchema),
    EmailRequest: toOpenApiSchema(forgotPasswordRequestSchema),
    AnalyticsOverviewResponse: toOpenApiSchema(
      analyticsOverviewResponseSchema,
      "output",
    ),
    AnalyticsStatusCount: toOpenApiSchema(
      analyticsStatusCountSchema,
      "output",
    ),
    CreateRoleRequest: toOpenApiSchema(createRoleRequestSchema),
    UpdateRoleRequest: toOpenApiSchema(updateRoleRequestSchema),
    UpdateRolePermissionsRequest: toOpenApiSchema(
      updateRolePermissionsRequestSchema,
    ),
    UpdateUserRoleRequest: toOpenApiSchema(updateUserRoleRequestSchema),
    AuditLogActor: toOpenApiSchema(auditLogActorSchema, "output"),
    AuditLog: toOpenApiSchema(auditLogSchema, "output"),
    AuditLogListResponse: toOpenApiSchema(
      auditLogListResponseSchema,
      "output",
    ),
    UserAccountStatus: toOpenApiSchema(userAccountStatusSchema, "output"),
    UpdateUserStatusRequest: toOpenApiSchema(updateUserStatusRequestSchema),
    Address: toOpenApiSchema(addressResponseSchema, "output"),
    CreateAddressRequest: toOpenApiSchema(createAddressRequestSchema),
    UpdateAddressRequest: toOpenApiSchema(updateAddressRequestSchema),
    CreateCategoryRequest: toOpenApiSchema(createCategoryRequestSchema),
    UpdateCategoryRequest: toOpenApiSchema(updateCategoryRequestSchema),
    ProductImageInput: toOpenApiSchema(productImageInputSchema),
    CreateProductRequest: toOpenApiSchema(createProductRequestSchema),
    UpdateProductRequest: toOpenApiSchema(updateProductRequestSchema),
    UpdateProductInventoryRequest: toOpenApiSchema(
      updateProductInventoryRequestSchema,
    ),
    AddCartItemRequest: toOpenApiSchema(addCartItemRequestSchema),
    UpdateCartItemRequest: toOpenApiSchema(updateCartItemRequestSchema),
    CheckoutOrderRequest: toOpenApiSchema(checkoutOrderRequestSchema),
    BuyNowCheckoutRequest: toOpenApiSchema(buyNowCheckoutRequestSchema),
    UpdateOrderStatusRequest: toOpenApiSchema(updateOrderStatusRequestSchema),
    CreateRefundRequest: toOpenApiSchema(createRefundRequestSchema),
    ReviewRefundRequest: toOpenApiSchema(reviewRefundRequestSchema),
    ConfirmRefundItemReceivedRequest: toOpenApiSchema(
      confirmRefundItemReceivedRequestSchema,
    ),
    PaymentWebhookEvent: toOpenApiSchema(
      paymentWebhookEventSchema,
      "output",
    ),
  },
} as const;

function uuidPathParameter(name: string) {
  return {
    name,
    in: "path",
    required: true,
    schema: { type: "string", format: "uuid" },
  } as const;
}

function errorResponseContent() {
  return {
    "application/json": {
      schema: { $ref: "#/components/schemas/ApiErrorResponse" },
    },
  } as const;
}
