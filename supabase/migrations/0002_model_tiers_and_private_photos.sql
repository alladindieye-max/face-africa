-- FACEAFRICA: public mannequin tiers and private, signed portfolio photos.
-- Requires the initial schema (0001_initial_schema.sql) to be applied first.

alter table public.model_profiles
  add column if not exists membership_tier text not null default 'BASIC'
  check (membership_tier in ('BASIC', 'STANDARD', 'PRO'));

-- Keep the portfolio private: public pages receive short-lived signed URLs only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('model-photos', 'model-photos', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Storage policies call a narrowly scoped SECURITY DEFINER helper so anonymous
-- visitors can sign only approved photos belonging to published profiles.
create or replace function public.can_read_published_model_photo(object_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.model_photos p
    join public.model_profiles m on m.id = p.model_profile_id
    where p.storage_path = object_name
      and p.moderation_status = 'approved'
      and m.status = 'published'
      and m.slug is not null
  );
$$;

revoke all on function public.can_read_published_model_photo(text) from public;
grant execute on function public.can_read_published_model_photo(text) to anon, authenticated;

drop policy if exists "Public can sign approved published model photos" on storage.objects;
create policy "Public can sign approved published model photos"
on storage.objects for select
to anon, authenticated
using (
  bucket_id = 'model-photos'
  and public.can_read_published_model_photo(name)
);

-- Recreate the curated public view with only approved photos and public-safe fields.
drop view if exists public.public_model_profiles;
create view public.public_model_profiles with (security_invoker = false) as
select
  m.id,
  m.slug,
  m.display_name,
  m.city,
  m.country,
  m.specialties,
  m.experience,
  m.languages,
  m.availability,
  m.agency_name,
  case when coalesce(m.visibility->>'measurements', 'false') = 'true'
    then m.measurements else '{}'::jsonb end as measurements,
  case when coalesce(m.visibility->>'phone', 'false') = 'true'
    then m.phone_public else null end as phone_public,
  case when coalesce(m.visibility->>'email', 'false') = 'true'
    then m.email_public else null end as email_public,
  case when coalesce(m.visibility->>'bio', 'true') = 'true'
    then m.bio else null end as public_bio,
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
  end as membership_sort_order
from public.model_profiles m
where m.status = 'published'
  and m.slug is not null;

revoke all on public.public_model_profiles from public;
grant select on public.public_model_profiles to anon, authenticated;
