import type { Prisma } from "../../generated/prisma/client.js";

export type AuditLogMetadata = Prisma.InputJsonValue;

export type AuditContext = {
  actorUserId?: string | undefined;
  actorType: string;
  requestId?: string | undefined;
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
};

export type RecordAuditLogInput = AuditContext & {
  action: string;
  resourceType: string;
  resourceId?: string | null | undefined;
  metadata?: AuditLogMetadata | undefined;
};

export type AuditLogWithActor = Prisma.AuditLogGetPayload<{
  include: {
    actor: {
      select: {
        id: true;
        name: true;
        firstName: true;
        lastName: true;
        email: true;
      };
    };
  };
}>;
