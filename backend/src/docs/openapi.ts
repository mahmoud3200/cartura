import { env } from "../config/env.js";

const authPaths = {
  "/api/v1/auth/sign-up/email": {
    post: {
      tags: ["Auth"],
      summary: "Create an email/password account",
      description:
        "Better Auth endpoint. With email OTP enabled, a 6-digit verification code is sent after sign-up.",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/BetterAuthSignUpEmail" },
          },
        },
      },
      responses: {
        "200": { description: "Account created" },
        "400": { $ref: "#/components/responses/AuthError" },
      },
    },
  },
  "/api/v1/auth/sign-in/email": {
    post: {
      tags: ["Auth"],
      summary: "Sign in with email and password",
      description:
        "Signs in with email and password. If the user enabled 2FA, this returns a two-factor challenge instead of the final session token.",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/BetterAuthSignInEmail" },
          },
        },
      },
      responses: {
        "200": { description: "Signed in" },
        "401": { $ref: "#/components/responses/AuthError" },
      },
    },
  },
  "/api/v1/auth/sign-out": {
    post: {
      tags: ["Auth"],
      summary: "Sign out current session",
      security: [{ bearerAuth: [] }],
      responses: {
        "200": { description: "Signed out" },
      },
    },
  },
  "/api/v1/auth/two-factor/send-otp": {
    post: {
      tags: ["Auth"],
      summary: "Send 2FA verification code",
      description:
        "For a logged-in user, this sends the code used to enable email OTP 2FA. During login, call this after sign-in returns twoFactorRedirect=true; it then uses Better Auth's temporary 2FA cookie.",
      requestBody: {
        required: false,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                trustDevice: { type: "boolean" },
              },
            },
          },
        },
      },
      responses: {
        "200": { description: "Sign-in code sent" },
      },
    },
  },
  "/api/v1/auth/two-factor/verify-otp": {
    post: {
      tags: ["Auth"],
      summary: "Verify 2FA code",
      description:
        "For a logged-in user, verifies the code and enables email OTP 2FA. During login, verifies the challenge and returns the final Better Auth session token.",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/BetterAuthVerifySignInOtp" },
          },
        },
      },
      responses: {
        "200": { description: "Sign-in verified; final token returned" },
        "400": { $ref: "#/components/responses/AuthError" },
      },
    },
  },
  "/api/v1/auth/two-factor/disable": {
    post: {
      tags: ["Auth"],
      summary: "Disable 2FA",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["password"],
              properties: {
                password: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        "200": { description: "2FA disabled" },
        "400": { $ref: "#/components/responses/AuthError" },
      },
    },
  },
  "/api/v1/auth/get-session": {
    get: {
      tags: ["Auth"],
      summary: "Get current session",
      security: [{ bearerAuth: [] }],
      responses: {
        "200": { description: "Current session or null" },
      },
    },
  },
  "/api/v1/auth/email-otp/send-verification-otp": {
    post: {
      tags: ["Auth"],
      summary: "Send a verification code",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/BetterAuthSendOtp" },
          },
        },
      },
      responses: {
        "200": { description: "Code sent when applicable" },
      },
    },
  },
  "/api/v1/auth/email-otp/verify-email": {
    post: {
      tags: ["Auth"],
      summary: "Verify email with a 6-digit code",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/BetterAuthVerifyEmailOtp" },
          },
        },
      },
      responses: {
        "200": { description: "Email verified" },
        "400": { $ref: "#/components/responses/AuthError" },
      },
    },
  },
  "/api/v1/auth/email-otp/request-password-reset": {
    post: {
      tags: ["Auth"],
      summary: "Send a password reset code",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/EmailRequest" },
          },
        },
      },
      responses: {
        "200": { description: "Reset code sent when applicable" },
      },
    },
  },
  "/api/v1/auth/email-otp/reset-password": {
    post: {
      tags: ["Auth"],
      summary: "Reset password with a 6-digit code",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/BetterAuthResetPasswordOtp" },
          },
        },
      },
      responses: {
        "200": { description: "Password reset" },
        "400": { $ref: "#/components/responses/AuthError" },
      },
    },
  },
  "/api/v1/auth/sign-in/social": {
    post: {
      tags: ["Auth"],
      summary: "Start Google OAuth sign-in",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/BetterAuthSocialSignIn" },
          },
        },
      },
      responses: {
        "200": { description: "OAuth redirect URL" },
      },
    },
  },
  "/api/v1/auth/token": {
    get: {
      tags: ["Auth"],
      summary: "Get Better Auth JWT for current session",
      description:
        "Optional. Requires an active session via cookie or Authorization: Bearer <session-token>; returns a short-lived JWT.",
      security: [{ bearerAuth: [] }],
      responses: {
        "200": { description: "JWT token" },
        "401": { $ref: "#/components/responses/AuthError" },
      },
    },
  },
} as const;

const devOnlyAuthPaths =
  env.NODE_ENV === "development"
    ? {
        "/api/v1/auth/reference": {
          get: {
            tags: ["Auth"],
            summary: "Better Auth generated API reference",
            responses: {
              "200": { description: "Better Auth API reference UI" },
            },
          },
        },
        "/api/v1/auth/open-api/generate-schema": {
          get: {
            tags: ["Auth"],
            summary: "Better Auth generated OpenAPI schema",
            responses: {
              "200": { description: "Generated Better Auth OpenAPI schema" },
            },
          },
        },
      }
    : {};

const analyticsPaths = {
  "/api/v1/management/analytics/overview": {
    get: {
      tags: ["Analytics"],
      summary: "Get management dashboard analytics overview",
      description:
        "Returns read-only operational summaries for the dashboard. Revenue is grouped by currency and is not converted.",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "range",
          in: "query",
          required: false,
          schema: {
            type: "string",
            enum: ["7d", "30d", "90d", "all"],
            default: "30d",
          },
        },
      ],
      responses: {
        "200": {
          description: "Analytics overview",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AnalyticsOverviewResponse" },
            },
          },
        },
        "401": { $ref: "#/components/responses/AuthError" },
        "403": { $ref: "#/components/responses/ForbiddenError" },
      },
    },
  },
} as const;

const authorizationPaths = {
  "/api/v1/management/authorization/permissions": {
    get: {
      tags: ["Authorization"],
      summary: "List permissions",
      security: [{ bearerAuth: [] }],
      responses: {
        "200": { description: "Permission list" },
        "401": { $ref: "#/components/responses/AuthError" },
        "403": { $ref: "#/components/responses/ForbiddenError" },
      },
    },
  },
  "/api/v1/management/authorization/roles": {
    get: {
      tags: ["Authorization"],
      summary: "List roles",
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: "#/components/parameters/Page" },
        { $ref: "#/components/parameters/Limit" },
      ],
      responses: {
        "200": { description: "Paginated role list" },
        "401": { $ref: "#/components/responses/AuthError" },
        "403": { $ref: "#/components/responses/ForbiddenError" },
      },
    },
    post: {
      tags: ["Authorization"],
      summary: "Create a custom role",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CreateRoleRequest" },
          },
        },
      },
      responses: {
        "201": { description: "Role created" },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/AuthError" },
        "403": { $ref: "#/components/responses/ForbiddenError" },
      },
    },
  },
  "/api/v1/management/authorization/roles/{roleId}": {
    patch: {
      tags: ["Authorization"],
      summary: "Update a custom role",
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: "#/components/parameters/RoleId" }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UpdateRoleRequest" },
          },
        },
      },
      responses: {
        "200": { description: "Role updated" },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/AuthError" },
        "403": { $ref: "#/components/responses/ForbiddenError" },
        "404": { description: "Role not found" },
      },
    },
    delete: {
      tags: ["Authorization"],
      summary: "Delete a custom role",
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: "#/components/parameters/RoleId" }],
      responses: {
        "204": { description: "Role deleted" },
        "401": { $ref: "#/components/responses/AuthError" },
        "403": { $ref: "#/components/responses/ForbiddenError" },
        "404": { description: "Role not found" },
      },
    },
  },
  "/api/v1/management/authorization/roles/{roleId}/permissions": {
    put: {
      tags: ["Authorization"],
      summary: "Replace custom role permissions",
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: "#/components/parameters/RoleId" }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/UpdateRolePermissionsRequest",
            },
          },
        },
      },
      responses: {
        "204": { description: "Permissions replaced" },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/AuthError" },
        "403": { $ref: "#/components/responses/ForbiddenError" },
        "404": { description: "Role not found" },
      },
    },
  },
  "/api/v1/management/authorization/users/{userId}/role": {
    put: {
      tags: ["Authorization"],
      summary: "Replace a user's role",
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: "#/components/parameters/UserId" }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UpdateUserRoleRequest" },
          },
        },
      },
      responses: {
        "204": { description: "Role updated" },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/AuthError" },
        "403": { $ref: "#/components/responses/ForbiddenError" },
      },
    },
  },
} as const;

const auditLogPaths = {
  "/api/v1/management/audit-logs": {
    get: {
      tags: ["Audit Logs"],
      summary: "List administrative audit logs",
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: "#/components/parameters/Page" },
        { $ref: "#/components/parameters/Limit" },
        {
          name: "actorUserId",
          in: "query",
          schema: { type: "string", format: "uuid" },
        },
        { name: "actorType", in: "query", schema: { type: "string" } },
        { name: "action", in: "query", schema: { type: "string" } },
        { name: "resourceType", in: "query", schema: { type: "string" } },
        { name: "resourceId", in: "query", schema: { type: "string" } },
        {
          name: "from",
          in: "query",
          schema: { type: "string", format: "date-time" },
        },
        {
          name: "to",
          in: "query",
          schema: { type: "string", format: "date-time" },
        },
      ],
      responses: {
        "200": {
          description: "Paginated audit log list",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AuditLogListResponse" },
            },
          },
        },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/AuthError" },
        "403": { $ref: "#/components/responses/ForbiddenError" },
      },
    },
  },
  "/api/v1/management/authorization/users/role-options": {
    get: {
      tags: ["Authorization"],
      summary: "List roles available for user assignment",
      security: [{ bearerAuth: [] }],
      responses: {
        "200": { description: "Assignable user role options" },
        "401": { $ref: "#/components/responses/AuthError" },
        "403": { $ref: "#/components/responses/ForbiddenError" },
      },
    },
  },
} as const;

const userManagementPaths = {
  "/api/v1/management/users": {
    get: {
      tags: ["User Management"],
      summary: "List users",
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: "#/components/parameters/Page" },
        { $ref: "#/components/parameters/Limit" },
        { name: "q", in: "query", schema: { type: "string" } },
        {
          name: "accountStatus",
          in: "query",
          schema: { $ref: "#/components/schemas/UserAccountStatus" },
        },
        {
          name: "emailVerified",
          in: "query",
          schema: { type: "boolean" },
        },
      ],
      responses: {
        "200": { description: "Paginated user list" },
        "401": { $ref: "#/components/responses/AuthError" },
        "403": { $ref: "#/components/responses/ForbiddenError" },
      },
    },
  },
  "/api/v1/management/users/{userId}": {
    get: {
      tags: ["User Management"],
      summary: "Get user by ID",
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: "#/components/parameters/UserId" }],
      responses: {
        "200": { description: "User" },
        "401": { $ref: "#/components/responses/AuthError" },
        "403": { $ref: "#/components/responses/ForbiddenError" },
        "404": { description: "User not found" },
      },
    },
  },
  "/api/v1/management/users/{userId}/status": {
    patch: {
      tags: ["User Management"],
      summary: "Update user account status",
      description:
        "Suspended and disabled accounts require a statusReason. Suspended accounts also require a future suspendedUntil timestamp. Setting a user active clears the reason and suspension expiry.",
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: "#/components/parameters/UserId" }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UpdateUserStatusRequest" },
          },
        },
      },
      responses: {
        "200": { description: "User status updated" },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/AuthError" },
        "403": { $ref: "#/components/responses/ForbiddenError" },
        "404": { description: "User not found" },
      },
    },
  },
} as const;

const addressPaths = {
  "/api/v1/addresses": {
    get: {
      tags: ["Addresses"],
      summary: "List current user's addresses",
      security: [{ bearerAuth: [] }],
      responses: {
        "200": { description: "Address list" },
        "401": { $ref: "#/components/responses/AuthError" },
      },
    },
    post: {
      tags: ["Addresses"],
      summary: "Create an address",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CreateAddressRequest" },
          },
        },
      },
      responses: {
        "201": { description: "Address created" },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/AuthError" },
        "409": { description: "Address limit exceeded" },
      },
    },
  },
  "/api/v1/addresses/{addressId}": {
    get: {
      tags: ["Addresses"],
      summary: "Get current user's address",
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: "#/components/parameters/AddressId" }],
      responses: {
        "200": { description: "Address" },
        "401": { $ref: "#/components/responses/AuthError" },
        "404": { description: "Address not found" },
      },
    },
    patch: {
      tags: ["Addresses"],
      summary: "Update current user's address",
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: "#/components/parameters/AddressId" }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UpdateAddressRequest" },
          },
        },
      },
      responses: {
        "200": { description: "Address updated" },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/AuthError" },
        "404": { description: "Address not found" },
      },
    },
    delete: {
      tags: ["Addresses"],
      summary: "Delete current user's address",
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: "#/components/parameters/AddressId" }],
      responses: {
        "204": { description: "Address deleted" },
        "401": { $ref: "#/components/responses/AuthError" },
        "404": { description: "Address not found" },
      },
    },
  },
  "/api/v1/addresses/{addressId}/default": {
    patch: {
      tags: ["Addresses"],
      summary: "Set current user's default address",
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: "#/components/parameters/AddressId" }],
      responses: {
        "200": { description: "Default address updated" },
        "401": { $ref: "#/components/responses/AuthError" },
        "404": { description: "Address not found" },
      },
    },
  },
} as const;

const mediaPaths = {
  "/api/v1/management/media/product-images": {
    post: {
      tags: ["Media Management"],
      summary: "Upload product images",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              required: ["files", "edits"],
              properties: {
                files: {
                  type: "array",
                  maxItems: 10,
                  items: {
                    type: "string",
                    format: "binary",
                  },
                },
                edits: {
                  type: "string",
                  description:
                    "JSON array with one crop or fit instruction for each file, in matching order",
                },
              },
            },
          },
        },
      },
      responses: {
        "201": { description: "Product image assets uploaded" },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/AuthError" },
        "403": { $ref: "#/components/responses/ForbiddenError" },
      },
    },
  },
  "/api/v1/management/media/category-banners": {
    post: {
      tags: ["Media Management"],
      summary: "Upload a category banner",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              required: ["files", "edits"],
              properties: {
                files: {
                  type: "array",
                  minItems: 1,
                  maxItems: 1,
                  items: {
                    type: "string",
                    format: "binary",
                  },
                },
                edits: {
                  type: "string",
                  description:
                    "JSON array containing the category banner crop or fit instruction",
                },
              },
            },
          },
        },
      },
      responses: {
        "201": { description: "Category banner asset uploaded" },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/AuthError" },
        "403": { $ref: "#/components/responses/ForbiddenError" },
      },
    },
  },
  "/api/v1/management/media/{mediaAssetId}": {
    delete: {
      tags: ["Media Management"],
      summary: "Delete a pending media asset",
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: "#/components/parameters/MediaAssetId" }],
      responses: {
        "204": { description: "Pending media asset deleted" },
        "401": { $ref: "#/components/responses/AuthError" },
        "403": { $ref: "#/components/responses/ForbiddenError" },
        "404": { description: "Media asset not found" },
        "409": { description: "Media asset is already attached" },
      },
    },
  },
} as const;

const catalogPaths = {
  "/api/v1/catalog/categories": {
    get: {
      tags: ["Catalog"],
      summary: "List active categories",
      parameters: [
        {
          name: "parentCategoryId",
          in: "query",
          required: false,
          schema: { type: "string", format: "uuid" },
        },
      ],
      responses: {
        "200": { description: "Category list" },
      },
    },
  },
  "/api/v1/catalog/categories/{slug}": {
    get: {
      tags: ["Catalog"],
      summary: "Get active category by slug",
      parameters: [{ $ref: "#/components/parameters/Slug" }],
      responses: {
        "200": { description: "Category" },
        "404": { description: "Category not found" },
      },
    },
  },
  "/api/v1/catalog/categories/{slug}/products": {
    get: {
      tags: ["Catalog"],
      summary: "List active products in a category",
      parameters: [
        { $ref: "#/components/parameters/Slug" },
        { $ref: "#/components/parameters/Page" },
        { $ref: "#/components/parameters/Limit" },
        {
          name: "q",
          in: "query",
          description: "Search product fields and assigned category names",
          schema: { type: "string" },
        },
        { name: "minPrice", in: "query", schema: { type: "number" } },
        { name: "maxPrice", in: "query", schema: { type: "number" } },
        { name: "inStock", in: "query", schema: { type: "boolean" } },
      ],
      responses: {
        "200": { description: "Paginated product list" },
      },
    },
  },
  "/api/v1/catalog/products": {
    get: {
      tags: ["Catalog"],
      summary: "List active products",
      parameters: [
        { $ref: "#/components/parameters/Page" },
        { $ref: "#/components/parameters/Limit" },
        {
          name: "q",
          in: "query",
          description: "Search product fields and assigned category names",
          schema: { type: "string" },
        },
        { name: "minPrice", in: "query", schema: { type: "number" } },
        { name: "maxPrice", in: "query", schema: { type: "number" } },
        { name: "inStock", in: "query", schema: { type: "boolean" } },
      ],
      responses: {
        "200": { description: "Paginated product list" },
      },
    },
  },
  "/api/v1/catalog/products/{slug}": {
    get: {
      tags: ["Catalog"],
      summary: "Get active product by slug",
      parameters: [{ $ref: "#/components/parameters/Slug" }],
      responses: {
        "200": { description: "Product" },
        "404": { description: "Product not found" },
      },
    },
  },
  "/api/v1/management/catalog/categories": {
    post: {
      tags: ["Catalog Management"],
      summary: "Create category",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CreateCategoryRequest" },
          },
        },
      },
      responses: {
        "201": { description: "Category created" },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/AuthError" },
        "403": { $ref: "#/components/responses/ForbiddenError" },
        "409": { description: "Slug conflict" },
      },
    },
  },
  "/api/v1/management/catalog/categories/{categoryId}": {
    patch: {
      tags: ["Catalog Management"],
      summary: "Update category",
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: "#/components/parameters/CategoryId" }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UpdateCategoryRequest" },
          },
        },
      },
      responses: {
        "200": { description: "Category updated" },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/AuthError" },
        "403": { $ref: "#/components/responses/ForbiddenError" },
        "404": { description: "Category not found" },
      },
    },
    delete: {
      tags: ["Catalog Management"],
      summary: "Deactivate category",
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: "#/components/parameters/CategoryId" }],
      responses: {
        "204": { description: "Category deactivated" },
        "401": { $ref: "#/components/responses/AuthError" },
        "403": { $ref: "#/components/responses/ForbiddenError" },
        "404": { description: "Category not found" },
      },
    },
  },
  "/api/v1/management/catalog/products": {
    post: {
      tags: ["Catalog Management"],
      summary: "Create product",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CreateProductRequest" },
          },
        },
      },
      responses: {
        "201": { description: "Product created" },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/AuthError" },
        "403": { $ref: "#/components/responses/ForbiddenError" },
        "409": { description: "Slug or SKU conflict" },
      },
    },
  },
  "/api/v1/management/catalog/products/{productId}": {
    patch: {
      tags: ["Catalog Management"],
      summary: "Update product",
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: "#/components/parameters/ProductId" }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UpdateProductRequest" },
          },
        },
      },
      responses: {
        "200": { description: "Product updated" },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/AuthError" },
        "403": { $ref: "#/components/responses/ForbiddenError" },
        "404": { description: "Product not found" },
      },
    },
    delete: {
      tags: ["Catalog Management"],
      summary: "Deactivate product",
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: "#/components/parameters/ProductId" }],
      responses: {
        "200": { description: "Product deactivated" },
        "401": { $ref: "#/components/responses/AuthError" },
        "403": { $ref: "#/components/responses/ForbiddenError" },
        "404": { description: "Product not found" },
      },
    },
  },
  "/api/v1/management/catalog/products/{productId}/inventory": {
    patch: {
      tags: ["Catalog Management"],
      summary: "Update product inventory",
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: "#/components/parameters/ProductId" }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/UpdateProductInventoryRequest",
            },
          },
        },
      },
      responses: {
        "200": { description: "Inventory updated" },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/AuthError" },
        "403": { $ref: "#/components/responses/ForbiddenError" },
        "404": { description: "Product not found" },
      },
    },
  },
} as const;

const cartPaths = {
  "/api/v1/cart": {
    get: {
      tags: ["Cart"],
      summary: "Get current user's cart",
      security: [{ bearerAuth: [] }],
      responses: {
        "200": { description: "Current cart" },
        "401": { $ref: "#/components/responses/AuthError" },
      },
    },
    delete: {
      tags: ["Cart"],
      summary: "Clear current user's cart",
      security: [{ bearerAuth: [] }],
      responses: {
        "200": { description: "Cart cleared" },
        "401": { $ref: "#/components/responses/AuthError" },
      },
    },
  },
  "/api/v1/cart/items": {
    post: {
      tags: ["Cart"],
      summary: "Add item to cart",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/AddCartItemRequest" },
          },
        },
      },
      responses: {
        "200": { description: "Cart updated" },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/AuthError" },
        "409": { description: "Product unavailable or insufficient stock" },
      },
    },
  },
  "/api/v1/cart/items/{productId}": {
    patch: {
      tags: ["Cart"],
      summary: "Update cart item quantity",
      description: "Set quantity to 0 to remove the item from the cart.",
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: "#/components/parameters/ProductId" }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UpdateCartItemRequest" },
          },
        },
      },
      responses: {
        "200": { description: "Cart updated" },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/AuthError" },
        "404": { description: "Cart item not found" },
        "409": { description: "Product unavailable or insufficient stock" },
      },
    },
    delete: {
      tags: ["Cart"],
      summary: "Remove item from cart",
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: "#/components/parameters/ProductId" }],
      responses: {
        "200": { description: "Cart updated" },
        "401": { $ref: "#/components/responses/AuthError" },
        "404": { description: "Cart item not found" },
      },
    },
  },
} as const;

const orderPaths = {
  "/api/v1/orders/checkout": {
    post: {
      tags: ["Orders"],
      summary: "Create an order checkout session",
      description:
        "Creates an order from the current cart. Card payments return a Paymob checkout URL; cash-on-delivery orders return a null checkout URL.",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CheckoutOrderRequest" },
          },
        },
      },
      responses: {
        "201": { description: "Checkout session created" },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/AuthError" },
        "409": { description: "Cart empty, product unavailable, or insufficient stock" },
        "503": { description: "Paymob is not configured for the requested currency" },
      },
    },
  },
  "/api/v1/orders/buy-now": {
    post: {
      tags: ["Orders"],
      summary: "Create an order for one product",
      description:
        "Creates an immediate order for one product. Card payments return a Paymob checkout URL; cash-on-delivery orders return a null checkout URL.",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/BuyNowCheckoutRequest" },
          },
        },
      },
      responses: {
        "201": { description: "Order created" },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/AuthError" },
        "404": { description: "Address or product not found" },
        "409": { description: "Product unavailable or insufficient stock" },
        "503": { description: "Paymob is not configured for the requested currency" },
      },
    },
  },
  "/api/v1/orders": {
    get: {
      tags: ["Orders"],
      summary: "List current user's orders",
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: "#/components/parameters/Page" },
        { $ref: "#/components/parameters/Limit" },
        { name: "status", in: "query", schema: { type: "string" } },
        {
          name: "paymentMethod",
          in: "query",
          schema: {
            type: "string",
            enum: ["card", "cash_on_delivery"],
          },
        },
        { name: "q", in: "query", schema: { type: "string" } },
      ],
      responses: {
        "200": { description: "Order list" },
        "401": { $ref: "#/components/responses/AuthError" },
      },
    },
  },
  "/api/v1/orders/{orderId}": {
    get: {
      tags: ["Orders"],
      summary: "Get current user's order",
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: "#/components/parameters/OrderId" }],
      responses: {
        "200": { description: "Order" },
        "401": { $ref: "#/components/responses/AuthError" },
        "404": { description: "Order not found" },
      },
    },
  },
  "/api/v1/management/orders": {
    get: {
      tags: ["Order Management"],
      summary: "List all orders",
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: "#/components/parameters/Page" },
        { $ref: "#/components/parameters/Limit" },
        { name: "status", in: "query", schema: { type: "string" } },
        {
          name: "paymentMethod",
          in: "query",
          schema: {
            type: "string",
            enum: ["card", "cash_on_delivery"],
          },
        },
        { name: "q", in: "query", schema: { type: "string" } },
      ],
      responses: {
        "200": { description: "Order list" },
        "401": { $ref: "#/components/responses/AuthError" },
        "403": { $ref: "#/components/responses/ForbiddenError" },
      },
    },
  },
  "/api/v1/management/orders/{orderId}": {
    get: {
      tags: ["Order Management"],
      summary: "Get order by ID",
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: "#/components/parameters/OrderId" }],
      responses: {
        "200": { description: "Order" },
        "401": { $ref: "#/components/responses/AuthError" },
        "403": { $ref: "#/components/responses/ForbiddenError" },
        "404": { description: "Order not found" },
      },
    },
  },
  "/api/v1/management/orders/{orderId}/status": {
    patch: {
      tags: ["Order Management"],
      summary: "Update order status",
      description:
        "Updates status using the backend order transition guard and records status history/audit logs.",
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: "#/components/parameters/OrderId" }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UpdateOrderStatusRequest" },
          },
        },
      },
      responses: {
        "200": { description: "Order status updated" },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/AuthError" },
        "403": { $ref: "#/components/responses/ForbiddenError" },
        "409": { description: "Invalid status transition" },
      },
    },
  },
} as const;

const paymentPaths = {
  "/api/v1/payments/{paymentId}": {
    get: {
      tags: ["Payments"],
      summary: "Get current user's payment",
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: "#/components/parameters/PaymentId" }],
      responses: {
        "200": { description: "Payment" },
        "401": { $ref: "#/components/responses/AuthError" },
        "404": { description: "Payment not found" },
      },
    },
  },
  "/api/v1/payments/paymob/webhook": {
    post: {
      tags: ["Payments"],
      summary: "Paymob transaction webhook",
      description:
        "Receives Paymob transaction callbacks. The hmac query parameter is verified before processing.",
      parameters: [
        {
          name: "hmac",
          in: "query",
          required: false,
          schema: { type: "string" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: true,
          },
        },
      },
      responses: {
        "200": { description: "Webhook accepted" },
        "400": { description: "Missing or invalid HMAC" },
        "503": { description: "Paymob HMAC secret is not configured" },
      },
    },
  },
  "/api/v1/management/payments/webhook-events": {
    get: {
      tags: ["Payment Management"],
      summary: "List payment webhook events",
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: "#/components/parameters/Page" },
        { $ref: "#/components/parameters/Limit" },
        { name: "status", in: "query", schema: { type: "string" } },
        { name: "provider", in: "query", schema: { type: "string" } },
        { name: "paymentId", in: "query", schema: { type: "string", format: "uuid" } },
      ],
      responses: {
        "200": { description: "Webhook event list" },
        "401": { $ref: "#/components/responses/AuthError" },
        "403": { $ref: "#/components/responses/ForbiddenError" },
      },
    },
  },
  "/api/v1/management/payments/webhook-events/{eventId}": {
    get: {
      tags: ["Payment Management"],
      summary: "Get payment webhook event",
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: "#/components/parameters/WebhookEventId" }],
      responses: {
        "200": { description: "Webhook event" },
        "401": { $ref: "#/components/responses/AuthError" },
        "403": { $ref: "#/components/responses/ForbiddenError" },
        "404": { description: "Webhook event not found" },
      },
    },
  },
  "/api/v1/management/payments/webhook-events/{eventId}/reprocess": {
    post: {
      tags: ["Payment Management"],
      summary: "Reprocess a payment webhook event",
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: "#/components/parameters/WebhookEventId" }],
      responses: {
        "200": { description: "Webhook event reprocessed" },
        "401": { $ref: "#/components/responses/AuthError" },
        "403": { $ref: "#/components/responses/ForbiddenError" },
        "404": { description: "Webhook event not found" },
        "409": { description: "Webhook event already processed" },
      },
    },
  },
} as const;

const refundPaths = {
  "/api/v1/refunds": {
    get: {
      tags: ["Refunds"],
      summary: "List the current customer's return requests",
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: "#/components/parameters/Page" },
        { $ref: "#/components/parameters/Limit" },
        { name: "status", in: "query", schema: { type: "string" } },
        { name: "orderId", in: "query", schema: { type: "string", format: "uuid" } },
      ],
      responses: {
        "200": { description: "Customer return list" },
        "401": { $ref: "#/components/responses/AuthError" },
      },
    },
    post: {
      tags: ["Refunds"],
      summary: "Request a return within 14 days of completed delivery",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CreateRefundRequest" },
          },
        },
      },
      responses: {
        "201": { description: "Return requested" },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/AuthError" },
        "404": { description: "Order not found" },
        "409": { description: "Order is outside the return window or already has a return" },
      },
    },
  },
  "/api/v1/management/refunds": {
    get: {
      tags: ["Refund Management"],
      summary: "List refunds",
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: "#/components/parameters/Page" },
        { $ref: "#/components/parameters/Limit" },
        { name: "status", in: "query", schema: { type: "string" } },
        { name: "paymentId", in: "query", schema: { type: "string", format: "uuid" } },
        { name: "orderId", in: "query", schema: { type: "string", format: "uuid" } },
      ],
      responses: {
        "200": { description: "Refund list" },
        "401": { $ref: "#/components/responses/AuthError" },
        "403": { $ref: "#/components/responses/ForbiddenError" },
      },
    },
  },
  "/api/v1/management/refunds/{refundId}/review": {
    post: {
      tags: ["Refund Management"],
      summary: "Approve or reject a return request",
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: "#/components/parameters/RefundId" }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ReviewRefundRequest" },
          },
        },
      },
      responses: {
        "200": { description: "Return reviewed" },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/AuthError" },
        "403": { $ref: "#/components/responses/ForbiddenError" },
        "404": { description: "Return request not found" },
        "409": { description: "Return request was already reviewed" },
      },
    },
  },
  "/api/v1/management/refunds/{refundId}/item-received": {
    post: {
      tags: ["Refund Management"],
      summary: "Confirm picked-up items were received and restock them",
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: "#/components/parameters/RefundId" }],
      requestBody: {
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ConfirmRefundItemReceivedRequest" },
          },
        },
      },
      responses: {
        "200": { description: "Returned items received and restocked" },
        "401": { $ref: "#/components/responses/AuthError" },
        "403": { $ref: "#/components/responses/ForbiddenError" },
        "404": { description: "Return request not found" },
        "409": { description: "Return is not waiting for item receipt" },
      },
    },
  },
  "/api/v1/management/refunds/{refundId}/execute": {
    post: {
      tags: ["Refund Management"],
      summary: "Issue an approved refund through the original payment method",
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: "#/components/parameters/RefundId" }],
      responses: {
        "200": { description: "Refund execution result" },
        "401": { $ref: "#/components/responses/AuthError" },
        "403": { $ref: "#/components/responses/ForbiddenError" },
        "404": { description: "Refund not found" },
        "409": { description: "Refund cannot be executed" },
        "503": { description: "Paymob refund endpoint/API key is not configured" },
      },
    },
  },
} as const;

const notificationPaths = {
  "/api/v1/notifications": {
    get: {
      tags: ["Notifications"],
      summary: "List current user's notifications",
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: "#/components/parameters/Page" },
        { $ref: "#/components/parameters/Limit" },
        { name: "unreadOnly", in: "query", schema: { type: "boolean" } },
      ],
      responses: {
        "200": { description: "Notification list" },
        "401": { $ref: "#/components/responses/AuthError" },
      },
    },
  },
  "/api/v1/notifications/read-all": {
    patch: {
      tags: ["Notifications"],
      summary: "Mark all current user's notifications as read",
      security: [{ bearerAuth: [] }],
      responses: {
        "200": { description: "Notifications updated" },
        "401": { $ref: "#/components/responses/AuthError" },
      },
    },
  },
  "/api/v1/notifications/{notificationId}/read": {
    patch: {
      tags: ["Notifications"],
      summary: "Mark a notification as read",
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: "#/components/parameters/NotificationId" }],
      responses: {
        "200": { description: "Notification updated" },
        "401": { $ref: "#/components/responses/AuthError" },
        "404": { description: "Notification not found" },
      },
    },
  },
} as const;

export const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "Cartura API",
    version: "0.1.0",
    description:
      "Backend API documentation for Cartura. Authentication is powered by Better Auth.",
  },
  servers: [
    {
      url: "http://localhost:4000",
      description: "Local development",
    },
  ],
  tags: [
    {
      name: "System",
      description: "System and health endpoints",
    },
    {
      name: "Auth",
      description: "Better Auth endpoints.",
    },
    {
      name: "Authorization",
      description: "Role and permission management endpoints.",
    },
    {
      name: "Analytics",
      description: "Protected operational dashboard analytics endpoints.",
    },
    {
      name: "Audit Logs",
      description: "Administrative audit log endpoints.",
    },
    {
      name: "User Management",
      description: "Protected user account management endpoints.",
    },
    {
      name: "Addresses",
      description: "Authenticated customer address endpoints.",
    },
    {
      name: "Catalog",
      description: "Public storefront catalog endpoints.",
    },
    {
      name: "Catalog Management",
      description: "Protected catalog management endpoints.",
    },
    {
      name: "Media Management",
      description: "Protected image upload and media asset endpoints.",
    },
    {
      name: "Cart",
      description: "Authenticated customer cart endpoints.",
    },
    {
      name: "Orders",
      description: "Authenticated customer order and checkout endpoints.",
    },
    {
      name: "Order Management",
      description: "Protected administrative order endpoints.",
    },
    {
      name: "Payments",
      description: "Customer payment and provider webhook endpoints.",
    },
    {
      name: "Payment Management",
      description: "Protected payment webhook recovery endpoints.",
    },
    {
      name: "Refund Management",
      description: "Protected return review, receipt, and refund execution endpoints.",
    },
    {
      name: "Refunds",
      description: "Authenticated customer return request endpoints.",
    },
    {
      name: "Notifications",
      description: "Authenticated user notification endpoints.",
    },
  ],
  paths: {
    "/health": {
      get: {
        tags: ["System"],
        summary: "Health check",
        responses: {
          "200": {
            description: "API is healthy",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["status", "timestamp"],
                  properties: {
                    status: { type: "string", example: "ok" },
                    timestamp: { type: "string", format: "date-time" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/v1": {
      get: {
        tags: ["System"],
        summary: "API metadata",
        responses: {
          "200": {
            description: "API metadata",
          },
        },
      },
    },
    ...authPaths,
    ...devOnlyAuthPaths,
    ...analyticsPaths,
    ...authorizationPaths,
    ...auditLogPaths,
    ...userManagementPaths,
    ...addressPaths,
    ...mediaPaths,
    ...catalogPaths,
    ...cartPaths,
    ...orderPaths,
    ...paymentPaths,
    ...refundPaths,
    ...notificationPaths,
  },
  components: {
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
      },
      ForbiddenError: {
        description: "The current user does not have the required permission",
      },
      ValidationError: {
        description: "Request validation failed",
      },
    },
    parameters: {
      RoleId: {
        name: "roleId",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
      },
      UserId: {
        name: "userId",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
      },
      AddressId: {
        name: "addressId",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
      },
      CategoryId: {
        name: "categoryId",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
      },
      ProductId: {
        name: "productId",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
      },
      MediaAssetId: {
        name: "mediaAssetId",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
      },
      OrderId: {
        name: "orderId",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
      },
      PaymentId: {
        name: "paymentId",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
      },
      RefundId: {
        name: "refundId",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
      },
      WebhookEventId: {
        name: "eventId",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
      },
      NotificationId: {
        name: "notificationId",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
      },
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
      BetterAuthSignUpEmail: {
        type: "object",
        required: ["email", "password", "firstName", "lastName"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 8, maxLength: 128 },
          firstName: { type: "string", minLength: 1, maxLength: 80 },
          lastName: { type: "string", minLength: 1, maxLength: 80 },
        },
      },
      BetterAuthSignInEmail: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string" },
          rememberMe: { type: "boolean" },
        },
      },
      BetterAuthVerifySignInOtp: {
        type: "object",
        required: ["code"],
        properties: {
          code: { type: "string", minLength: 6, maxLength: 6 },
          trustDevice: { type: "boolean" },
        },
      },
      BetterAuthSendOtp: {
        type: "object",
        required: ["email", "type"],
        properties: {
          email: { type: "string", format: "email" },
          type: {
            type: "string",
            enum: [
              "sign-in",
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
      BetterAuthSocialSignIn: {
        type: "object",
        required: ["provider"],
        properties: {
          provider: { type: "string", enum: ["google"] },
          callbackURL: { type: "string", format: "uri" },
        },
      },
      EmailRequest: {
        type: "object",
        required: ["email"],
        properties: {
          email: { type: "string", format: "email" },
        },
      },
      AnalyticsOverviewResponse: {
        type: "object",
        required: [
          "data",
        ],
        properties: {
          data: {
            type: "object",
            required: [
              "generatedAt",
              "range",
              "totals",
              "revenue",
              "ordersByStatus",
              "refundsByStatus",
              "paymentWebhooksByStatus",
              "recent",
            ],
            properties: {
              generatedAt: { type: "string", format: "date-time" },
              range: {
                type: "object",
                required: ["preset", "from", "to"],
                properties: {
                  preset: {
                    type: "string",
                    enum: ["7d", "30d", "90d", "all"],
                  },
                  from: {
                    type: ["string", "null"],
                    format: "date-time",
                  },
                  to: { type: "string", format: "date-time" },
                },
              },
              totals: {
                type: "object",
                required: [
                  "orders",
                  "paidOrders",
                  "users",
                  "refunds",
                  "paymentIssues",
                ],
                properties: {
                  orders: { type: "integer", minimum: 0 },
                  paidOrders: { type: "integer", minimum: 0 },
                  users: { type: "integer", minimum: 0 },
                  refunds: { type: "integer", minimum: 0 },
                  paymentIssues: { type: "integer", minimum: 0 },
                },
              },
              revenue: {
                type: "array",
                items: {
                  type: "object",
                  required: ["currency", "gross", "refunded", "net", "paidOrders"],
                  properties: {
                    currency: { type: "string", minLength: 3, maxLength: 3 },
                    gross: { type: "number", minimum: 0 },
                    refunded: { type: "number", minimum: 0 },
                    net: { type: "number" },
                    paidOrders: { type: "integer", minimum: 0 },
                  },
                },
              },
              ordersByStatus: {
                type: "array",
                items: { $ref: "#/components/schemas/AnalyticsStatusCount" },
              },
              refundsByStatus: {
                type: "array",
                items: { $ref: "#/components/schemas/AnalyticsStatusCount" },
              },
              paymentWebhooksByStatus: {
                type: "array",
                items: { $ref: "#/components/schemas/AnalyticsStatusCount" },
              },
              recent: {
                type: "object",
                description:
                  "Recent orders, users, refunds, and payment webhook events using compact dashboard-safe fields.",
              },
            },
            example: {
              generatedAt: "2026-07-03T12:00:00.000Z",
              range: {
                preset: "30d",
                from: "2026-06-03T12:00:00.000Z",
                to: "2026-07-03T12:00:00.000Z",
              },
              totals: {
                orders: 42,
                paidOrders: 31,
                users: 18,
                refunds: 4,
                paymentIssues: 2,
              },
              revenue: [
                {
                  currency: "EGP",
                  gross: 18250,
                  refunded: 700,
                  net: 17550,
                  paidOrders: 31,
                },
              ],
              ordersByStatus: [{ status: "paid", count: 21 }],
              refundsByStatus: [{ status: "completed", count: 2 }],
              paymentWebhooksByStatus: [{ status: "processed", count: 33 }],
              recent: {
                orders: [],
                users: [],
                refunds: [],
                paymentWebhookEvents: [],
              },
            },
          },
        },
      },
      AnalyticsStatusCount: {
        type: "object",
        required: ["status", "count"],
        properties: {
          status: { type: "string" },
          count: { type: "integer", minimum: 0 },
        },
      },
      CreateRoleRequest: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string", minLength: 2, maxLength: 80 },
          description: { type: "string", maxLength: 500 },
          permissionIds: {
            type: "array",
            items: { type: "string", format: "uuid" },
            default: [],
          },
        },
      },
      UpdateRoleRequest: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 2, maxLength: 80 },
          description: { type: "string", maxLength: 500 },
        },
      },
      UpdateRolePermissionsRequest: {
        type: "object",
        required: ["permissionIds"],
        properties: {
          permissionIds: {
            type: "array",
            items: { type: "string", format: "uuid" },
          },
        },
      },
      UpdateUserRoleRequest: {
        type: "object",
        required: ["roleId"],
        properties: {
          roleId: { type: "string", format: "uuid" },
        },
      },
      AuditLogActor: {
        type: "object",
        required: ["id", "name", "firstName", "lastName", "email"],
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          firstName: { type: "string" },
          lastName: { type: "string" },
          email: { type: "string", format: "email" },
        },
      },
      AuditLog: {
        type: "object",
        required: [
          "id",
          "actorUserId",
          "actorType",
          "actor",
          "action",
          "resourceType",
          "resourceId",
          "requestId",
          "ipAddress",
          "userAgent",
          "metadata",
          "createdAt",
        ],
        properties: {
          id: { type: "string", format: "uuid" },
          actorUserId: {
            anyOf: [{ type: "string", format: "uuid" }, { type: "null" }],
          },
          actorType: { type: "string" },
          actor: {
            anyOf: [
              { $ref: "#/components/schemas/AuditLogActor" },
              { type: "null" },
            ],
          },
          action: { type: "string" },
          resourceType: { type: "string" },
          resourceId: {
            anyOf: [{ type: "string" }, { type: "null" }],
          },
          requestId: {
            anyOf: [{ type: "string" }, { type: "null" }],
          },
          ipAddress: {
            anyOf: [{ type: "string" }, { type: "null" }],
          },
          userAgent: {
            anyOf: [{ type: "string" }, { type: "null" }],
          },
          metadata: true,
          createdAt: { type: "string", format: "date-time" },
        },
      },
      AuditLogListResponse: {
        type: "object",
        required: ["data", "pagination"],
        properties: {
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/AuditLog" },
          },
          pagination: {
            type: "object",
            required: [
              "page",
              "limit",
              "totalItems",
              "totalPages",
              "hasNextPage",
              "hasPreviousPage",
            ],
            properties: {
              page: { type: "integer" },
              limit: { type: "integer" },
              totalItems: { type: "integer" },
              totalPages: { type: "integer" },
              hasNextPage: { type: "boolean" },
              hasPreviousPage: { type: "boolean" },
            },
          },
        },
      },
      UserAccountStatus: {
        type: "string",
        enum: ["active", "suspended", "disabled"],
      },
      UpdateUserStatusRequest: {
        type: "object",
        required: ["accountStatus"],
        properties: {
          accountStatus: {
            $ref: "#/components/schemas/UserAccountStatus",
          },
          statusReason: {
            anyOf: [
              { type: "string", minLength: 1, maxLength: 500 },
              { type: "null" },
            ],
          },
          suspendedUntil: {
            anyOf: [
              { type: "string", format: "date-time" },
              { type: "null" },
            ],
          },
        },
      },
      Address: {
        type: "object",
        required: [
          "id",
          "userId",
          "addressName",
          "recipientName",
          "phoneNumber",
          "country",
          "city",
          "area",
          "streetAddress",
          "postalCode",
          "isDefault",
          "createdAt",
          "updatedAt",
        ],
        properties: {
          id: { type: "string", format: "uuid" },
          userId: { type: "string", format: "uuid" },
          addressName: { type: "string" },
          recipientName: { type: "string" },
          phoneNumber: { type: "string" },
          country: { type: "string" },
          city: { type: "string" },
          area: { type: "string" },
          streetAddress: { type: "string" },
          postalCode: {
            anyOf: [{ type: "string" }, { type: "null" }],
          },
          isDefault: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      CreateAddressRequest: {
        type: "object",
        required: [
          "addressName",
          "recipientName",
          "phoneNumber",
          "country",
          "city",
          "area",
          "streetAddress",
        ],
        properties: {
          addressName: { type: "string", minLength: 2, maxLength: 80 },
          recipientName: { type: "string", minLength: 2, maxLength: 120 },
          phoneNumber: { type: "string", minLength: 5, maxLength: 30 },
          country: { type: "string", minLength: 2, maxLength: 80 },
          city: { type: "string", minLength: 2, maxLength: 80 },
          area: { type: "string", minLength: 1, maxLength: 120 },
          streetAddress: { type: "string", minLength: 5, maxLength: 250 },
          postalCode: {
            type: "string",
            maxLength: 30,
            pattern: "^[0-9]*$",
          },
          isDefault: { type: "boolean" },
        },
      },
      UpdateAddressRequest: {
        type: "object",
        properties: {
          addressName: { type: "string", minLength: 2, maxLength: 80 },
          recipientName: { type: "string", minLength: 2, maxLength: 120 },
          phoneNumber: { type: "string", minLength: 5, maxLength: 30 },
          country: { type: "string", minLength: 2, maxLength: 80 },
          city: { type: "string", minLength: 2, maxLength: 80 },
          area: { type: "string", minLength: 1, maxLength: 120 },
          streetAddress: { type: "string", minLength: 5, maxLength: 250 },
          postalCode: {
            anyOf: [
              {
                type: "string",
                maxLength: 30,
                pattern: "^[0-9]*$",
              },
              { type: "null" },
            ],
          },
        },
      },
      CreateCategoryRequest: {
        type: "object",
        required: ["name", "slug", "imageAssetId"],
        properties: {
          parentCategoryId: { type: "string", format: "uuid" },
          name: { type: "string", minLength: 2, maxLength: 120 },
          slug: { type: "string", minLength: 2, maxLength: 140 },
          description: { type: "string", maxLength: 1000 },
          imageAssetId: { type: "string", format: "uuid" },
        },
      },
      UpdateCategoryRequest: {
        type: "object",
        properties: {
          parentCategoryId: {
            anyOf: [{ type: "string", format: "uuid" }, { type: "null" }],
          },
          name: { type: "string", minLength: 2, maxLength: 120 },
          slug: { type: "string", minLength: 2, maxLength: 140 },
          description: {
            anyOf: [{ type: "string", maxLength: 1000 }, { type: "null" }],
          },
          imageAssetId: {
            type: "string",
            format: "uuid",
          },
        },
      },
      ProductImageInput: {
        type: "object",
        required: ["mediaAssetId"],
        properties: {
          mediaAssetId: { type: "string", format: "uuid" },
          altText: { type: "string", maxLength: 200 },
          displayOrder: { type: "integer", minimum: 0, default: 0 },
        },
      },
      CreateProductRequest: {
        type: "object",
        required: ["name", "slug", "sku", "price"],
        properties: {
          name: { type: "string", minLength: 2, maxLength: 160 },
          slug: { type: "string", minLength: 2, maxLength: 180 },
          description: { type: "string", maxLength: 5000 },
          sku: { type: "string", minLength: 1, maxLength: 80 },
          price: { type: "number", minimum: 0 },
          stockQuantity: { type: "integer", minimum: 0, default: 0 },
          categoryIds: {
            type: "array",
            items: { type: "string", format: "uuid" },
            default: [],
          },
          images: {
            type: "array",
            items: { $ref: "#/components/schemas/ProductImageInput" },
            default: [],
          },
        },
      },
      UpdateProductRequest: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 2, maxLength: 160 },
          slug: { type: "string", minLength: 2, maxLength: 180 },
          description: {
            anyOf: [{ type: "string", maxLength: 5000 }, { type: "null" }],
          },
          sku: { type: "string", minLength: 1, maxLength: 80 },
          price: { type: "number", minimum: 0 },
          stockQuantity: { type: "integer", minimum: 0 },
          isDeleted: { type: "boolean" },
          categoryIds: {
            type: "array",
            items: { type: "string", format: "uuid" },
          },
          images: {
            type: "array",
            items: { $ref: "#/components/schemas/ProductImageInput" },
          },
        },
      },
      UpdateProductInventoryRequest: {
        type: "object",
        required: ["stockQuantity"],
        properties: {
          stockQuantity: { type: "integer", minimum: 0 },
        },
      },
      AddCartItemRequest: {
        type: "object",
        required: ["productId", "quantity"],
        properties: {
          productId: { type: "string", format: "uuid" },
          quantity: { type: "integer", minimum: 1 },
        },
      },
      UpdateCartItemRequest: {
        type: "object",
        required: ["quantity"],
        properties: {
          quantity: { type: "integer", minimum: 0 },
        },
      },
      CheckoutOrderRequest: {
        type: "object",
        required: ["addressId", "idempotencyKey"],
        properties: {
          addressId: { type: "string", format: "uuid" },
          paymentMethod: {
            type: "string",
            enum: ["card", "cash_on_delivery"],
            default: "card",
          },
          currency: {
            type: "string",
            minLength: 3,
            maxLength: 3,
            default: "EGP",
          },
          idempotencyKey: { type: "string", minLength: 8, maxLength: 120 },
          notes: { type: "string", maxLength: 500 },
        },
      },
      BuyNowCheckoutRequest: {
        type: "object",
        required: ["productId", "addressId", "idempotencyKey"],
        properties: {
          productId: { type: "string", format: "uuid" },
          quantity: {
            type: "integer",
            minimum: 1,
            maximum: 99,
            default: 1,
          },
          addressId: { type: "string", format: "uuid" },
          paymentMethod: {
            type: "string",
            enum: ["card", "cash_on_delivery"],
            default: "card",
          },
          currency: {
            type: "string",
            minLength: 3,
            maxLength: 3,
            default: "EGP",
          },
          idempotencyKey: { type: "string", minLength: 8, maxLength: 120 },
          notes: { type: "string", maxLength: 500 },
        },
      },
      UpdateOrderStatusRequest: {
        type: "object",
        required: ["status"],
        properties: {
          status: {
            type: "string",
            enum: [
              "processing",
              "shipped",
              "completed",
              "cancelled",
            ],
          },
          note: { type: "string", maxLength: 500 },
        },
      },
      CreateRefundRequest: {
        type: "object",
        required: ["orderId", "reason"],
        properties: {
          orderId: { type: "string", format: "uuid" },
          reason: {
            type: "string",
            enum: ["damaged", "defective", "wrong_item", "not_as_described", "changed_mind", "other"],
          },
          note: { type: "string", minLength: 1, maxLength: 1000 },
        },
      },
      ReviewRefundRequest: {
        oneOf: [
          {
            type: "object",
            required: ["decision", "resolution"],
            properties: {
              decision: { type: "string", enum: ["approve"] },
              resolution: { type: "string", enum: ["pickup", "keep_item"] },
              reviewNote: { type: "string", minLength: 1, maxLength: 1000 },
              pickupScheduledAt: { type: "string", format: "date-time" },
            },
          },
          {
            type: "object",
            required: ["decision", "reviewNote"],
            properties: {
              decision: { type: "string", enum: ["reject"] },
              reviewNote: { type: "string", minLength: 1, maxLength: 1000 },
            },
          },
        ],
      },
      ConfirmRefundItemReceivedRequest: {
        type: "object",
        properties: {
          note: { type: "string", minLength: 1, maxLength: 1000 },
        },
      },
      PaymentWebhookEvent: {
        type: "object",
        required: [
          "id",
          "paymentId",
          "provider",
          "providerEventId",
          "eventType",
          "status",
          "attempts",
          "payload",
          "failureReason",
          "receivedAt",
          "processedAt",
        ],
        properties: {
          id: { type: "string", format: "uuid" },
          paymentId: {
            anyOf: [{ type: "string", format: "uuid" }, { type: "null" }],
          },
          provider: { type: "string" },
          providerEventId: { type: "string" },
          eventType: { type: "string" },
          status: { type: "string" },
          attempts: { type: "integer", minimum: 0 },
          payload: true,
          failureReason: {
            anyOf: [{ type: "string" }, { type: "null" }],
          },
          receivedAt: { type: "string", format: "date-time" },
          processedAt: {
            anyOf: [{ type: "string", format: "date-time" }, { type: "null" }],
          },
        },
      },
    },
  },
} as const;
