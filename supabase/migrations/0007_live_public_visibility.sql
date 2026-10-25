-- Make mannequin visibility preferences effective on public profiles and allow owners to edit published profile details.
-- The workflow trigger still prevents owners from publishing, rejecting, or suspending profiles themselves.
drop policy if exists "model owner updates own draft" on public.model_profiles;
create policy "model owner updates own profile details" on public.model_profiles
  for update to authenticated
  using (user_id = auth.uid() or public.is_app_admin())
  with check (user_id = auth.uid() or public.is_app_admin());

drop view if exists public.public_model_profiles;
create view public.public_model_profiles with (security_invoker = false) as
select
  m.id,
  m.slug,
  m.display_name,
  case when coalesce(m.visibility->>'exact_city', 'true') = 'true' then m.city else null end as city,
  m.country,
  m.specialties,
  case when coalesce(m.visibility->>'skills', 'false') = 'true' then m.secondary_skills else array[]::text[] end as secondary_skills,
  case when coalesce(m.visibility->>'social_metrics', 'false') = 'true' then coalesce(m.social_metrics, '{}'::jsonb) else '{}'::jsonb end as social_metrics,
  case when coalesce(m.visibility->>'experience', 'false') = 'true' then m.experience else null end as experience,
  case when coalesce(m.visibility->>'languages', 'false') = 'true' then m.languages else null end as languages,
  case when coalesce(m.visibility->>'availability', 'false') = 'true' then m.availability else null end as availability,
  case when coalesce(m.visibility->>'agency', 'false') = 'true' then m.agency_name else null end as agency_name,
  case when coalesce(m.visibility->>'measurements', 'false') = 'true' then m.measurements else '{}'::jsonb end as measurements,
  case when coalesce(m.visibility->>'phone', 'false') = 'true' then m.phone_public else null end as phone_public,
  case when coalesce(m.visibility->>'email', 'false') = 'true' then m.email_public else null end as email_public,
  case when coalesce(m.visibility->>'bio', 'true') = 'true' then m.bio else null end as public_bio,
  (
    select p.storage_path
    from public.model_photos p
    where p.model_profile_id = m.id
      and p.photo_type = 'main'
      and p.moderation_status = 'approved'
    order by p.sort_order
    limit 1
  ) as main_photo_path,
  coalesce((
    select array_agg(p.storage_path order by case when p.photo_type = 'main' then 0 else 1 end, p.sort_order)
    from public.model_photos p
    where p.model_profile_id = m.id
      and p.moderation_status = 'approved'
  ), array[]::text[]) as portfolio_photo_paths,
  m.membership_tier,
  case m.membership_tier
    when 'STANDARD' then 1
    when 'PRO' then 2
    else 3
  end as membership_sort_order,
  m.is_verified,
  m.is_featured
from public.model_profiles m
where m.status = 'published'
  and m.slug is not null;

revoke all on public.public_model_profiles from public;
grant select on public.public_model_profiles to anon, authenticated;
