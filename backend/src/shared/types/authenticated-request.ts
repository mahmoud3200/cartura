import type { Request } from "express";

export type Principal = {
  userId: string;
  sessionId: string;
};

export type AuthenticatedRequest = Request & {
  principal?: Principal;
};
