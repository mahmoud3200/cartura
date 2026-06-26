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
      responses: {
        "200": { description: "Role list" },
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
  "/api/v1/management/authorization/users/{userId}/roles": {
    put: {
      tags: ["Authorization"],
      summary: "Assign a role to a user",
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: "#/components/parameters/UserId" }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/AssignUserRoleRequest" },
          },
        },
      },
      responses: {
        "204": { description: "Role assigned" },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/AuthError" },
        "403": { $ref: "#/components/responses/ForbiddenError" },
      },
    },
  },
  "/api/v1/management/authorization/users/{userId}/roles/{roleId}": {
    delete: {
      tags: ["Authorization"],
      summary: "Remove a role from a user",
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: "#/components/parameters/UserId" },
        { $ref: "#/components/parameters/RoleId" },
      ],
      responses: {
        "204": { description: "Role removed" },
        "401": { $ref: "#/components/responses/AuthError" },
        "403": { $ref: "#/components/responses/ForbiddenError" },
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
  "/api/v1/catalog/products": {
    get: {
      tags: ["Catalog"],
      summary: "List active products",
      parameters: [
        { name: "page", in: "query", schema: { type: "integer", default: 1 } },
        {
          name: "pageSize",
          in: "query",
          schema: { type: "integer", default: 20, maximum: 100 },
        },
        { name: "q", in: "query", schema: { type: "string" } },
        { name: "categorySlug", in: "query", schema: { type: "string" } },
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
        "200": { description: "Category deactivated" },
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
      name: "Catalog",
      description: "Public storefront catalog endpoints.",
    },
    {
      name: "Catalog Management",
      description: "Protected catalog management endpoints.",
    },
    {
      name: "Cart",
      description: "Authenticated customer cart endpoints.",
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
    ...authorizationPaths,
    ...catalogPaths,
    ...cartPaths,
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
      Slug: {
        name: "slug",
        in: "path",
        required: true,
        schema: { type: "string" },
      },
    },
    schemas: {
      BetterAuthSignUpEmail: {
        type: "object",
        required: ["email", "password", "name"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 8, maxLength: 128 },
          name: { type: "string" },
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
      AssignUserRoleRequest: {
        type: "object",
        required: ["roleId"],
        properties: {
          roleId: { type: "string", format: "uuid" },
        },
      },
      CreateCategoryRequest: {
        type: "object",
        required: ["name", "slug"],
        properties: {
          parentCategoryId: { type: "string", format: "uuid" },
          name: { type: "string", minLength: 2, maxLength: 120 },
          slug: { type: "string", minLength: 2, maxLength: 140 },
          description: { type: "string", maxLength: 1000 },
          imageUrl: { type: "string", maxLength: 2048 },
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
          imageUrl: {
            anyOf: [{ type: "string", maxLength: 2048 }, { type: "null" }],
          },
          isActive: { type: "boolean" },
        },
      },
      ProductImageInput: {
        type: "object",
        required: ["imageUrl"],
        properties: {
          imageUrl: { type: "string", maxLength: 2048 },
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
          isActive: { type: "boolean" },
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
    },
  },
} as const;
