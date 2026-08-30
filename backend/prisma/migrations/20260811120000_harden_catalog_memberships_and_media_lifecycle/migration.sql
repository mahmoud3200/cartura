ALTER TABLE "product_categories"
ADD COLUMN "is_direct" BOOLEAN NOT NULL DEFAULT TRUE;

-- The legacy join table stored materialized ancestors without provenance. An
-- explicit parent plus descendant selection is therefore indistinguishable
-- from inherited membership; the deepest existing memberships are treated as
-- direct. All writes preserve direct memberships explicitly after this point.
WITH RECURSIVE "membership_ancestors" (
  "product_id",
  "descendant_category_id",
  "ancestor_category_id"
) AS (
  SELECT
    "membership"."product_id",
    "membership"."category_id",
    "category"."parent_category_id"
  FROM "product_categories" AS "membership"
  INNER JOIN "categories" AS "category"
    ON "category"."id" = "membership"."category_id"
  WHERE "category"."parent_category_id" IS NOT NULL

  UNION

  SELECT
    "membership_ancestors"."product_id",
    "membership_ancestors"."descendant_category_id",
    "category"."parent_category_id"
  FROM "membership_ancestors"
  INNER JOIN "categories" AS "category"
    ON "category"."id" = "membership_ancestors"."ancestor_category_id"
  WHERE "category"."parent_category_id" IS NOT NULL
)
UPDATE "product_categories" AS "membership"
SET "is_direct" = FALSE
WHERE EXISTS (
  SELECT 1
  FROM "membership_ancestors"
  WHERE
    "membership_ancestors"."product_id" = "membership"."product_id"
    AND "membership_ancestors"."ancestor_category_id" = "membership"."category_id"
);

CREATE INDEX "product_categories_category_id_is_direct_idx"
ON "product_categories"("category_id", "is_direct");

-- These columns already have unique indexes, so the old non-unique indexes
-- only duplicate write and storage cost.
DROP INDEX IF EXISTS "categories_image_asset_id_idx";
DROP INDEX IF EXISTS "product_images_media_asset_id_idx";

ALTER TABLE "media_assets"
ADD COLUMN "pending_expires_at" TIMESTAMP(3),
ADD COLUMN "deletion_claimed_at" TIMESTAMP(3);

UPDATE "media_assets"
SET "pending_expires_at" = "created_at" + INTERVAL '24 hours'
WHERE "status" = 'pending';

CREATE INDEX "media_assets_status_pending_expires_at_idx"
ON "media_assets"("status", "pending_expires_at");

ALTER TABLE "media_assets"
ADD CONSTRAINT "media_assets_status_check"
CHECK ("status" IN ('pending', 'attached', 'deleting'));

ALTER TABLE "media_assets"
ADD CONSTRAINT "media_assets_deletion_claim_consistency_check"
CHECK (
  (
    "status" = 'deleting'
    AND "deletion_claimed_at" IS NOT NULL
  )
  OR (
    "status" <> 'deleting'
    AND "deletion_claimed_at" IS NULL
  )
);

ALTER TABLE "media_assets"
ADD CONSTRAINT "media_assets_pending_expiration_consistency_check"
CHECK (
  (
    "status" = 'attached'
    AND "pending_expires_at" IS NULL
  )
  OR (
    "status" IN ('pending', 'deleting')
    AND "pending_expires_at" IS NOT NULL
  )
);
