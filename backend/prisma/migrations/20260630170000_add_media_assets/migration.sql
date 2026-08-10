-- CreateTable
CREATE TABLE "media_assets" (
    "id" UUID NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'cloudinary',
    "public_id" TEXT NOT NULL,
    "secure_url" TEXT NOT NULL,
    "canonical_url" TEXT NOT NULL,
    "usage" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "mime_type" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "bytes" INTEGER NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "variants" JSONB,
    "uploaded_by" UUID,
    "attached_resource_type" TEXT,
    "attached_resource_id" UUID,
    "attached_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "categories" ADD COLUMN "image_asset_id" UUID;

-- AlterTable
ALTER TABLE "product_images" ADD COLUMN "media_asset_id" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "media_assets_public_id_key" ON "media_assets"("public_id");

-- CreateIndex
CREATE INDEX "media_assets_uploaded_by_idx" ON "media_assets"("uploaded_by");

-- CreateIndex
CREATE INDEX "media_assets_status_created_at_idx" ON "media_assets"("status", "created_at");

-- CreateIndex
CREATE INDEX "media_assets_usage_status_idx" ON "media_assets"("usage", "status");

-- CreateIndex
CREATE INDEX "media_assets_attached_resource_type_attached_resource_id_idx" ON "media_assets"("attached_resource_type", "attached_resource_id");

-- CreateIndex
CREATE UNIQUE INDEX "categories_image_asset_id_key" ON "categories"("image_asset_id");

-- CreateIndex
CREATE INDEX "categories_image_asset_id_idx" ON "categories"("image_asset_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_images_media_asset_id_key" ON "product_images"("media_asset_id");

-- CreateIndex
CREATE INDEX "product_images_media_asset_id_idx" ON "product_images"("media_asset_id");

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_image_asset_id_fkey" FOREIGN KEY ("image_asset_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_media_asset_id_fkey" FOREIGN KEY ("media_asset_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
