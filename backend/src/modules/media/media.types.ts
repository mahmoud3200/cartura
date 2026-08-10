import type { Prisma } from "../../generated/prisma/client.js";

export type MediaAsset = Prisma.MediaAssetGetPayload<Record<string, never>>;

export type AttachedResource = {
  type: "product" | "category";
  id: string;
};
