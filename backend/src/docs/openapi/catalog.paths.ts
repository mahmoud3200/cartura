export const catalogPaths = {
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

