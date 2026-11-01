-- Reduce the externally callable surface of internal role helper RPCs.
-- These helpers are used by authenticated RLS policies; anonymous callers
-- do not need direct RPC access. Keep authenticated execution for policy checks.
REVOKE EXECUTE ON FUNCTION public.current_app_role() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_app_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_app_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_app_admin() TO authenticated;
