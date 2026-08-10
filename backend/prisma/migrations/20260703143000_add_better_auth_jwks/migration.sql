CREATE TABLE "jwks" (
  "id" TEXT NOT NULL,
  "publicKey" TEXT NOT NULL,
  "privateKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL,
  "expiresAt" TIMESTAMP(3),

  CONSTRAINT "jwks_pkey" PRIMARY KEY ("id")
);
