begin;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

alter view public.public_model_profiles set schema private;
alter view private.public_model_profiles rename to public_model_profiles_source;
alter view public.public_photographers set schema private;
alter view private.public_photographers rename to public_photographers_source;

create table public.public_model_profile_data as
select * from private.public_model_profiles_source;
alter table public.public_model_profile_data add primary key (id);
alter table public.public_model_profile_data enable row level security;
create policy public_model_profile_data_read
on public.public_model_profile_data for select to anon, authenticated using (true);
revoke all on public.public_model_profile_data from public, anon, authenticated;
grant select on public.public_model_profile_data to anon, authenticated;

create table public.public_photographer_data as
select * from private.public_photographers_source;
alter table public.public_photographer_data add primary key (id);
alter table public.public_photographer_data enable row level security;
create policy public_photographer_data_read
on public.public_photographer_data for select to anon, authenticated using (true);
revoke all on public.public_photographer_data from public, anon, authenticated;
grant select on public.public_photographer_data to anon, authenticated;

create or replace function private.refresh_public_model_profile(target_id uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, private, pg_temp
as $$
begin
  delete from public.public_model_profile_data d
  where d.id = target_id
    and not exists (
      select 1 from private.public_model_profiles_source s where s.id = target_id
    );

  insert into public.public_model_profile_data
  select * from private.public_model_profiles_source s where s.id = target_id
  on conflict (id) do update set
    slug = excluded.slug,
    display_name = excluded.display_name,
    city = excluded.city,
    country = excluded.country,
    specialties = excluded.specialties,
    secondary_skills = excluded.secondary_skills,
    social_metrics = excluded.social_metrics,
    experience = excluded.experience,
    languages = excluded.languages,
    availability = excluded.availability,
    agency_name = excluded.agency_name,
    measurements = excluded.measurements,
    phone_public = excluded.phone_public,
    email_public = excluded.email_public,
    public_bio = excluded.public_bio,
    main_photo_path = excluded.main_photo_path,
    portfolio_photo_paths = excluded.portfolio_photo_paths,
    membership_tier = excluded.membership_tier,
    membership_sort_order = excluded.membership_sort_order,
    is_verified = excluded.is_verified,
    is_featured = excluded.is_featured;
end;
$$;

create or replace function private.sync_public_model_profile_trigger()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, private, pg_temp
as $$
begin
  if tg_op = 'DELETE' then
    perform private.refresh_public_model_profile(old.id);
    return old;
  end if;
  perform private.refresh_public_model_profile(new.id);
  return new;
end;
$$;

create or replace function private.sync_public_model_photo_trigger()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, private, pg_temp
as $$
begin
  if tg_op = 'DELETE' then
    perform private.refresh_public_model_profile(old.model_profile_id);
    return old;
  elsif tg_op = 'UPDATE' then
    if old.model_profile_id is distinct from new.model_profile_id then
      perform private.refresh_public_model_profile(old.model_profile_id);
    end if;
    perform private.refresh_public_model_profile(new.model_profile_id);
    return new;
  end if;
  perform private.refresh_public_model_profile(new.model_profile_id);
  return new;
end;
$$;

create or replace function private.refresh_public_photographer(target_id uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, private, pg_temp
as $$
begin
  delete from public.public_photographer_data d
  where d.id = target_id
    and not exists (
      select 1 from private.public_photographers_source s where s.id = target_id
    );

  insert into public.public_photographer_data
  select * from private.public_photographers_source s where s.id = target_id
  on conflict (id) do update set
    professional_name = excluded.professional_name,
    company_name = excluded.company_name,
    city = excluded.city,
    travel_areas = excluded.travel_areas,
    specialties = excluded.specialties,
    portfolio_urls = excluded.portfolio_urls,
    service_types = excluded.service_types,
    responsible_name = excluded.responsible_name,
    logo_storage_path = excluded.logo_storage_path,
    personal_description = excluded.personal_description,
    is_demo = excluded.is_demo;
end;
$$;

create or replace function private.sync_public_photographer_trigger()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, private, pg_temp
as $$
begin
  if tg_op = 'DELETE' then
    perform private.refresh_public_photographer(old.id);
    return old;
  end if;
  perform private.refresh_public_photographer(new.id);
  return new;
end;
$$;

revoke all on function private.refresh_public_model_profile(uuid) from public, anon, authenticated;
revoke all on function private.sync_public_model_profile_trigger() from public, anon, authenticated;
revoke all on function private.sync_public_model_photo_trigger() from public, anon, authenticated;
revoke all on function private.refresh_public_photographer(uuid) from public, anon, authenticated;
revoke all on function private.sync_public_photographer_trigger() from public, anon, authenticated;

create trigger sync_public_model_profile
after insert or update or delete on public.model_profiles
for each row execute function private.sync_public_model_profile_trigger();

create trigger sync_public_model_photos
after insert or update or delete on public.model_photos
for each row execute function private.sync_public_model_photo_trigger();

create trigger sync_public_photographers
after insert or update or delete on public.photographers
for each row execute function private.sync_public_photographer_trigger();

create view public.public_model_profiles with (security_invoker = true) as
select * from public.public_model_profile_data;
create view public.public_photographers with (security_invoker = true) as
select * from public.public_photographer_data;

revoke all privileges on table public.public_model_profiles from public, anon, authenticated;
revoke all privileges on table public.public_photographers from public, anon, authenticated;
grant select on table public.public_model_profiles to anon, authenticated;
grant select on table public.public_photographers to anon, authenticated;

commit;
