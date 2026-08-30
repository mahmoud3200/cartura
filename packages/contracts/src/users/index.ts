import { z } from "zod";
import { paginatedQuerySchema } from "../common/index.js";

const booleanQuerySchema = z.preprocess((value) => {
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
}, z.boolean());

export const userAccountStatusSchema = z.enum([
  "active",
  "suspended",
  "disabled",
]);

export const listUsersQuerySchema = paginatedQuerySchema({
  q: z.string().trim().min(1).max(120).optional(),
  accountStatus: userAccountStatusSchema.optional(),
  emailVerified: booleanQuerySchema.optional(),
});

export const updateUserStatusRequestSchema = z
  .object({
    accountStatus: userAccountStatusSchema,
    statusReason: z.string().trim().min(1).max(500).nullable().optional(),
    suspendedUntil: z.iso.datetime().nullable().optional(),
  })
  .strict()
  .superRefine((input, ctx) => {
  if (input.accountStatus === "active") {
    if (input.statusReason) {
      ctx.addIssue({
        code: "custom",
        path: ["statusReason"],
        message: "Active accounts cannot have a status reason",
      });
    }
    if (input.suspendedUntil) {
      ctx.addIssue({
        code: "custom",
        path: ["suspendedUntil"],
        message: "Active accounts cannot have a suspension expiry",
      });
    }

    return;
  }

  if (!input.statusReason) {
    ctx.addIssue({
      code: "custom",
      path: ["statusReason"],
      message: "A status reason is required",
    });
  }

  if (input.accountStatus === "disabled") {
    if (input.suspendedUntil) {
      ctx.addIssue({
        code: "custom",
        path: ["suspendedUntil"],
        message: "Disabled accounts cannot have a suspension expiry",
      });
    }

    return;
  }

  if (!input.suspendedUntil) {
    ctx.addIssue({
      code: "custom",
      path: ["suspendedUntil"],
      message: "Suspended accounts require a suspension expiry",
    });
    return;
  }

  if (new Date(input.suspendedUntil).getTime() <= Date.now()) {
    ctx.addIssue({
      code: "custom",
      path: ["suspendedUntil"],
      message: "Suspension expiry must be in the future",
    });
  }
  });

export const userRoleSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string().nullable(),
  isSystemRole: z.boolean(),
  assignedAt: z.iso.datetime(),
});

export const userIdParamsSchema = z.object({
  userId: z.uuid(),
}).strict();

export const userSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.email(),
  emailVerified: z.boolean(),
  image: z.string().nullable(),
  twoFactorEnabled: z.boolean(),
  accountStatus: userAccountStatusSchema,
  accountStatusReason: z.string().nullable(),
  suspendedUntil: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  role: userRoleSchema.nullable(),
});

export type UserAccountStatus = z.infer<typeof userAccountStatusSchema>;
export type UserIdParams = z.infer<typeof userIdParamsSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type UpdateUserStatusRequest = z.infer<
  typeof updateUserStatusRequestSchema
>;
export type UserRole = z.infer<typeof userRoleSchema>;
export type User = z.infer<typeof userSchema>;
