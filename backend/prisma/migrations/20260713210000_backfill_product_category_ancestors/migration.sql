WITH RECURSIVE "inherited_product_categories" ("product_id", "category_id") AS (
  SELECT
    "product_category"."product_id",
    "child_category"."parent_category_id"
  FROM "product_categories" AS "product_category"
  INNER JOIN "categories" AS "child_category"
    ON "child_category"."id" = "product_category"."category_id"
    AND "child_category"."is_deleted" = FALSE
  WHERE "child_category"."parent_category_id" IS NOT NULL

  UNION

  SELECT
    "membership"."product_id",
    "parent_category"."parent_category_id"
  FROM "inherited_product_categories" AS "membership"
  INNER JOIN "categories" AS "parent_category"
    ON "parent_category"."id" = "membership"."category_id"
    AND "parent_category"."is_deleted" = FALSE
  WHERE "parent_category"."parent_category_id" IS NOT NULL
)
INSERT INTO "product_categories" ("product_id", "category_id")
SELECT DISTINCT
  "membership"."product_id",
  "membership"."category_id"
FROM "inherited_product_categories" AS "membership"
INNER JOIN "categories" AS "ancestor_category"
  ON "ancestor_category"."id" = "membership"."category_id"
  AND "ancestor_category"."is_deleted" = FALSE
ON CONFLICT ("product_id", "category_id") DO NOTHING;

ALTER TABLE "notification_deliveries"
DROP CONSTRAINT IF EXISTS "notification_deliveries_status_check";

ALTER TABLE "notification_deliveries"
ADD CONSTRAINT "notification_deliveries_status_check"
CHECK (
  "status" IN ('pending', 'processing', 'sent', 'failed')
);
