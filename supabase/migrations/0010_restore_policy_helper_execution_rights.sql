-- Restore execution rights required by existing RLS and Storage policy expressions.
-- These helper functions are called by policy predicates; revoking them breaks public
-- catalogue/photo access rather than improving row-level security.
grant execute on function public.can_read_published_model_photo(text) to anon, authenticated;
grant execute on function public.current_app_role() to anon, authenticated;
grant execute on function public.is_app_admin() to anon, authenticated;
