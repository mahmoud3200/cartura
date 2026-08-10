ALTER TABLE "users"
ADD COLUMN "first_name" TEXT,
ADD COLUMN "last_name" TEXT;

UPDATE "users"
SET
  "first_name" = COALESCE(NULLIF(split_part(trim("name"), ' ', 1), ''), 'User'),
  "last_name" = COALESCE(
    NULLIF(
      CASE
        WHEN position(' ' in trim("name")) > 0
          THEN substring(trim("name") from position(' ' in trim("name")) + 1)
        ELSE ''
      END,
      ''
    ),
    'User'
  );

ALTER TABLE "users"
ALTER COLUMN "first_name" SET NOT NULL,
ALTER COLUMN "last_name" SET NOT NULL;
