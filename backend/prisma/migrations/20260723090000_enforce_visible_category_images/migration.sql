ALTER TABLE "categories"
ADD CONSTRAINT "categories_visible_image_required_check"
CHECK (
  "is_deleted"
  OR (
    "image_asset_id" IS NOT NULL
    AND "image_url" IS NOT NULL
  )
) NOT VALID;

COMMENT ON CONSTRAINT "categories_visible_image_required_check" ON "categories"
IS 'Every visible category must have an attached image asset and canonical image URL.';
