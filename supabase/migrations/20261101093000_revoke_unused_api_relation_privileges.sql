-- Remove privileges that browser/API clients never need.
-- TRUNCATE bypasses row-level security; TRIGGER and REFERENCES are DDL-oriented
-- privileges and should not be granted to public application roles.
DO $$
DECLARE
  rel record;
BEGIN
  FOR rel IN
    SELECT c.oid::regclass AS relation_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind IN ('r', 'p', 'v', 'm', 'f')
  LOOP
    EXECUTE format(
      'REVOKE TRUNCATE, TRIGGER, REFERENCES ON TABLE %s FROM PUBLIC, anon, authenticated',
      rel.relation_name
    );
  END LOOP;
END
$$;
