export const notificationPaths = {
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

