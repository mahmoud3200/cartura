export const mediaPaths = {
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

