CREATE OR REPLACE FUNCTION enforce_user_address_limit()
RETURNS trigger AS $$
DECLARE
  address_count integer := 0;
BEGIN
  PERFORM 1
  FROM "users"
  WHERE "id" = NEW."user_id"
  FOR UPDATE;

  SELECT COUNT(*)
  INTO address_count
  FROM "addresses"
  WHERE "user_id" = NEW."user_id";

  IF address_count >= 20 THEN
    RAISE EXCEPTION 'A user can have at most 20 addresses'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "addresses_enforce_user_limit_before_insert" ON "addresses";
CREATE TRIGGER "addresses_enforce_user_limit_before_insert"
BEFORE INSERT ON "addresses"
FOR EACH ROW
EXECUTE FUNCTION enforce_user_address_limit();
