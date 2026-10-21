-- FACEAFRICA V2 initial schema. Apply with Supabase CLI after reviewing project settings.
create extension if not exists pgcrypto;
create type public.account_role as enum ('model','advertiser','admin');
create type public.account_status as enum ('active','pending','suspended','deleted');
create type public.model_profile_status as enum ('draft','pending_review','published','rejected','suspended');
create type public.comp_card_status as enum ('absent','draft','pending_review','approved','rejected');
create type public.casting_status as enum ('draft','pending_payment','payment_pending','paid_pending_review','published','rejected','expired','archived');
create type public.payment_status as enum ('pending','processing','succeeded','failed','cancelled','refunded');
create type public.shooting_status as enum ('received','under_review','finding_photographer','photographer_proposed','awaiting_confirmation','confirmed','completed','cancelled');
create type public.application_status as enum ('submitted','under_review','shortlisted','selected','rejected','withdrawn');

create table public.user_profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 role public.account_role not null default 'model',
 status public.account_status not null default 'pending',
 first_name text not null default '', last_name text not null default '',
 email text not null, phone text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 constraint user_profiles_email_length check (char_length(email) between 3 and 320)
);
create index user_profiles_role_status_idx on public.user_profiles(role,status);

create table public.model_profiles (
 id uuid primary key default gen_random_uuid(), user_id uuid not null unique references public.user_profiles(id) on delete cascade,
 slug text unique, display_name text not null default '', city text not null default 'Dakar', country text not null default 'Sénégal',
 bio text, specialties text[] not null default '{}', experience text, languages text[] not null default '{}', availability text,
 agency_name text, measurements jsonb not null default '{}'::jsonb,
 visibility jsonb not null default '{"phone":false,"email":false,"exact_city":false,"bio":true,"measurements":false,"professional_links":true}'::jsonb,
 phone_public text, email_public text, professional_links jsonb not null default '[]'::jsonb,
 status public.model_profile_status not null default 'draft', rejection_reason text,
 reviewed_by uuid references public.user_profiles(id) on delete set null, reviewed_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index model_profiles_status_city_idx on public.model_profiles(status,city);
create index model_profiles_specialties_idx on public.model_profiles using gin(specialties);
create index model_profiles_display_name_idx on public.model_profiles using gin(to_tsvector('simple',display_name));

create table public.model_photos (
 id uuid primary key default gen_random_uuid(), model_profile_id uuid not null references public.model_profiles(id) on delete cascade,
 storage_path text not null, photo_type text not null default 'portfolio' check(photo_type in ('main','portfolio','comp_card')),
 caption text, sort_order integer not null default 0, moderation_status text not null default 'pending' check(moderation_status in ('pending','approved','rejected')),
 created_at timestamptz not null default now(), unique(model_profile_id,storage_path)
);
create index model_photos_profile_order_idx on public.model_photos(model_profile_id,sort_order);

create table public.comp_cards (
 id uuid primary key default gen_random_uuid(), model_profile_id uuid not null references public.model_profiles(id) on delete cascade,
 status public.comp_card_status not null default 'draft', generation_data jsonb not null default '{}'::jsonb, document_storage_path text,
 validated_by uuid references public.user_profiles(id) on delete set null, validated_at timestamptz, rejection_reason text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.advertisers (
 id uuid primary key default gen_random_uuid(), user_id uuid not null unique references public.user_profiles(id) on delete cascade,
 business_name text not null, activity_type text, city text not null default 'Dakar', country text not null default 'Sénégal',
 public_contact_enabled boolean not null default false, public_email text, public_phone text,
 status text not null default 'pending' check(status in ('pending','active','suspended')), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.photographers (
 id uuid primary key default gen_random_uuid(), professional_name text not null, company_name text, email text, phone text,
 city text not null, travel_areas text[] not null default '{}', specialties text[] not null default '{}', portfolio_urls text[] not null default '{}',
 reference_rates jsonb not null default '{}'::jsonb, service_types text[] not null default '{}', availability jsonb not null default '[]'::jsonb,
 commercial_terms text, partnership_status text not null default 'pending' check(partnership_status in ('pending','active','inactive')),
 internal_notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index photographers_city_status_idx on public.photographers(city,partnership_status);

create table public.shooting_requests (
 id uuid primary key default gen_random_uuid(), reference_code text not null unique default ('FA-SHOOT-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10))),
 requester_user_id uuid references public.user_profiles(id) on delete set null,
 full_name text not null, email text not null, phone text not null, city text not null, shooting_type text not null,
 desired_period text not null, budget_xof bigint check(budget_xof is null or budget_xof>=0), description text not null,
 preferred_mode text not null check(preferred_mode in ('team_finds','client_chooses')),
 preferred_photographer_id uuid references public.photographers(id) on delete set null,
 assigned_photographer_id uuid references public.photographers(id) on delete set null,
 reference_price_xof bigint check(reference_price_xof is null or reference_price_xof>=0), discount_percent numeric(5,2) not null default 25 check(discount_percent between 0 and 100),
 discount_xof bigint check(discount_xof is null or discount_xof>=0), proposed_price_xof bigint check(proposed_price_xof is null or proposed_price_xof>=0), quote_terms text,
 status public.shooting_status not null default 'received', consent_at timestamptz not null default now(), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index shooting_requests_status_city_idx on public.shooting_requests(status,city);
create index shooting_requests_created_idx on public.shooting_requests(created_at desc);

create table public.castings (
 id uuid primary key default gen_random_uuid(), advertiser_id uuid not null references public.advertisers(id) on delete cascade,
 slug text unique, title text not null, cover_storage_path text, description text not null, city text not null default 'Dakar', country text not null default 'Sénégal', location text,
 casting_type text not null, desired_profiles text[] not null default '{}', selection_criteria text, participation_terms text,
 compensation_description text, contact_visibility text not null default 'platform' check(contact_visibility in ('platform','business_name','public_contact')),
 publication_fee_xof bigint not null default 2000 check(publication_fee_xof>=0), status public.casting_status not null default 'draft',
 published_at timestamptz, deadline_at timestamptz, event_start_at timestamptz, event_end_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index castings_status_city_deadline_idx on public.castings(status,city,deadline_at);

create table public.payments (
 id uuid primary key default gen_random_uuid(), order_reference text not null unique default ('FA-PAY-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,12))),
 provider text not null, provider_transaction_reference text, advertiser_id uuid references public.advertisers(id) on delete set null,
 casting_id uuid references public.castings(id) on delete set null, shooting_request_id uuid references public.shooting_requests(id) on delete set null,
 amount_xof bigint not null check(amount_xof>=0), currency text not null default 'XOF' check(currency='XOF'), status public.payment_status not null default 'pending',
 provider_payload jsonb not null default '{}'::jsonb, idempotency_key text unique, confirmed_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 constraint payment_has_target check(num_nonnulls(casting_id,shooting_request_id)=1)
);
create unique index payments_provider_ref_unique on public.payments(provider,provider_transaction_reference) where provider_transaction_reference is not null;
create index payments_status_created_idx on public.payments(status,created_at desc);

create table public.casting_applications (
 id uuid primary key default gen_random_uuid(), casting_id uuid not null references public.castings(id) on delete cascade,
 model_profile_id uuid not null references public.model_profiles(id) on delete cascade, status public.application_status not null default 'submitted',
 note text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(casting_id,model_profile_id)
);
create index casting_applications_status_idx on public.casting_applications(casting_id,status);

create table public.notifications (
 id uuid primary key default gen_random_uuid(), recipient_user_id uuid not null references public.user_profiles(id) on delete cascade,
 notification_type text not null, title text not null, body text not null, read_at timestamptz, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create index notifications_recipient_unread_idx on public.notifications(recipient_user_id,read_at,created_at desc);

create table public.audit_log (
 id bigint generated always as identity primary key, actor_user_id uuid references public.user_profiles(id) on delete set null,
 action text not null, entity_type text not null, entity_id text, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create index audit_log_entity_idx on public.audit_log(entity_type,entity_id,created_at desc);

create table public.platform_settings (
 key text primary key, value jsonb not null, description text, updated_by uuid references public.user_profiles(id) on delete set null, updated_at timestamptz not null default now()
);
insert into public.platform_settings(key,value,description) values
 ('casting_listing_fee_xof','2000'::jsonb,'Tarif par annonce de casting en XOF'),
 ('eligible_shooting_discount_percent','25'::jsonb,'Réduction proposée sur les shootings éligibles'),
 ('launch_cities','["Dakar"]'::jsonb,'Villes disponibles au lancement'),
 ('casting_applications_enabled','false'::jsonb,'Active les candidatures aux castings lorsque le parcours est prêt')
on conflict(key) do nothing;

-- RLS enabled everywhere. Policies are intentionally restrictive; service-role admin operations belong server-side.
alter table public.user_profiles enable row level security;
alter table public.model_profiles enable row level security;
alter table public.model_photos enable row level security;
alter table public.comp_cards enable row level security;
alter table public.advertisers enable row level security;
alter table public.photographers enable row level security;
alter table public.shooting_requests enable row level security;
alter table public.castings enable row level security;
alter table public.payments enable row level security;
alter table public.casting_applications enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_log enable row level security;
alter table public.platform_settings enable row level security;

create function public.current_app_role() returns public.account_role language sql stable security definer set search_path=public as $$ select role from public.user_profiles where id=auth.uid() $$;
create function public.is_app_admin() returns boolean language sql stable security definer set search_path=public as $$ select coalesce(public.current_app_role()='admin',false) $$;

create policy "users read own account" on public.user_profiles for select to authenticated using (id=auth.uid() or public.is_app_admin());
create policy "users update own non-role fields" on public.user_profiles for update to authenticated using (id=auth.uid() or public.is_app_admin()) with check (id=auth.uid() or public.is_app_admin());
-- Role assignment is not exposed through client policies; provisioning/admin role changes must use a trusted server operation.
create policy "model owner reads own profile" on public.model_profiles for select to authenticated using (user_id=auth.uid() or public.is_app_admin());
create policy "model owner creates own profile" on public.model_profiles for insert to authenticated with check (user_id=auth.uid() and status='draft' and reviewed_by is null and reviewed_at is null);
create policy "model owner updates own draft" on public.model_profiles for update to authenticated using (user_id=auth.uid() and status in ('draft','rejected') or public.is_app_admin()) with check (user_id=auth.uid() or public.is_app_admin());
-- Public access to model data is granted through the curated view below, not the base table.
create policy "model owner manages photos" on public.model_photos for all to authenticated using (exists(select 1 from public.model_profiles m where m.id=model_profile_id and m.user_id=auth.uid()) or public.is_app_admin()) with check (exists(select 1 from public.model_profiles m where m.id=model_profile_id and m.user_id=auth.uid()) or public.is_app_admin());
create policy "public approved photos for published profiles" on public.model_photos for select to anon,authenticated using (moderation_status='approved' and exists(select 1 from public.model_profiles m where m.id=model_profile_id and m.status='published'));
create policy "model owner reads comp card" on public.comp_cards for select to authenticated using (exists(select 1 from public.model_profiles m where m.id=model_profile_id and m.user_id=auth.uid()) or public.is_app_admin());
create policy "model owner creates comp card draft" on public.comp_cards for insert to authenticated with check (status='draft' and exists(select 1 from public.model_profiles m where m.id=model_profile_id and m.user_id=auth.uid()));
create policy "model owner updates own comp card draft" on public.comp_cards for update to authenticated using (exists(select 1 from public.model_profiles m where m.id=model_profile_id and m.user_id=auth.uid()) and status in ('draft','rejected') or public.is_app_admin()) with check (exists(select 1 from public.model_profiles m where m.id=model_profile_id and m.user_id=auth.uid()) or public.is_app_admin());
create policy "advertiser reads own business" on public.advertisers for select to authenticated using (user_id=auth.uid() or public.is_app_admin());
create policy "advertiser creates own business" on public.advertisers for insert to authenticated with check (user_id=auth.uid() and status='pending');
create policy "advertiser updates own business" on public.advertisers for update to authenticated using (user_id=auth.uid() or public.is_app_admin()) with check (user_id=auth.uid() or public.is_app_admin());
-- Partner contact information and internal notes are never exposed through the base table.
create policy "admins manage photographers" on public.photographers for all to authenticated using (public.is_app_admin()) with check (public.is_app_admin());
create policy "shooting requester reads own request" on public.shooting_requests for select to authenticated using (requester_user_id=auth.uid() or public.is_app_admin());
create policy "shooting requester inserts own request" on public.shooting_requests for insert to authenticated with check (requester_user_id=auth.uid());
create policy "public can read published active castings" on public.castings for select to anon,authenticated using (status='published' and (deadline_at is null or deadline_at>now()));
create policy "advertiser reads own castings" on public.castings for select to authenticated using (exists(select 1 from public.advertisers a where a.id=advertiser_id and a.user_id=auth.uid()) or public.is_app_admin());
create policy "advertiser creates own draft casting" on public.castings for insert to authenticated with check (status='draft' and exists(select 1 from public.advertisers a where a.id=advertiser_id and a.user_id=auth.uid()));
create policy "advertiser edits own draft casting" on public.castings for update to authenticated using (exists(select 1 from public.advertisers a where a.id=advertiser_id and a.user_id=auth.uid()) and status in ('draft','rejected') or public.is_app_admin()) with check (exists(select 1 from public.advertisers a where a.id=advertiser_id and a.user_id=auth.uid()) or public.is_app_admin());
create policy "payment owner reads own payments" on public.payments for select to authenticated using (public.is_app_admin() or exists(select 1 from public.advertisers a where a.id=advertiser_id and a.user_id=auth.uid()) or exists(select 1 from public.shooting_requests s where s.id=shooting_request_id and s.requester_user_id=auth.uid()));
create policy "model reads own applications" on public.casting_applications for select to authenticated using (exists(select 1 from public.model_profiles m where m.id=model_profile_id and m.user_id=auth.uid()) or public.is_app_admin() or exists(select 1 from public.castings c join public.advertisers a on a.id=c.advertiser_id where c.id=casting_id and a.user_id=auth.uid()));
create policy "model submits own application" on public.casting_applications for insert to authenticated with check (status='submitted' and exists(select 1 from public.model_profiles m where m.id=model_profile_id and m.user_id=auth.uid() and m.status='published') and exists(select 1 from public.castings c where c.id=casting_id and c.status='published' and (c.deadline_at is null or c.deadline_at>now())));
create policy "user reads own notifications" on public.notifications for select to authenticated using (recipient_user_id=auth.uid() or public.is_app_admin());
create policy "user marks own notifications read" on public.notifications for update to authenticated using (recipient_user_id=auth.uid()) with check (recipient_user_id=auth.uid());
create policy "admin reads audit log" on public.audit_log for select to authenticated using (public.is_app_admin());
create policy "admin reads settings" on public.platform_settings for select to authenticated using (public.is_app_admin());
create policy "admin updates settings" on public.platform_settings for update to authenticated using (public.is_app_admin()) with check (public.is_app_admin());

-- Public views deliberately expose only whitelisted fields. Personal contact data is excluded.
create view public.public_model_profiles with (security_invoker=false) as
 select m.id,m.slug,m.display_name,m.city,m.country,m.specialties,m.experience,m.languages,m.availability,m.agency_name,
   case when coalesce(m.visibility->>'measurements','false')='true' then m.measurements else '{}'::jsonb end as measurements,
   case when coalesce(m.visibility->>'phone','false')='true' then m.phone_public else null end as phone_public,
   case when coalesce(m.visibility->>'email','false')='true' then m.email_public else null end as email_public,
   case when coalesce(m.visibility->>'bio','true')='true' then m.bio else null end as public_bio,
   (select p.storage_path from public.model_photos p where p.model_profile_id=m.id and p.photo_type='main' and p.moderation_status='approved' order by p.sort_order limit 1) as main_photo_path
 from public.model_profiles m where m.status='published' and m.slug is not null;


-- Provision a least-privilege default model account after Supabase email signup.
create function public.handle_new_auth_user() returns trigger language plpgsql security definer set search_path=public as $$
begin
 insert into public.user_profiles(id,role,status,first_name,last_name,email)
 values(new.id,'model','pending',coalesce(new.raw_user_meta_data->>'first_name',''),coalesce(new.raw_user_meta_data->>'last_name',''),coalesce(new.email,''))
 on conflict(id) do nothing;
 insert into public.model_profiles(user_id,display_name,city,country,status)
 values(new.id,trim(coalesce(new.raw_user_meta_data->>'first_name','') || ' ' || coalesce(new.raw_user_meta_data->>'last_name','')),'Dakar',coalesce(new.raw_user_meta_data->>'country','Sénégal'),'draft')
 on conflict(user_id) do nothing;
 return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_auth_user();

-- Prevent users from self-assigning privileged roles or changing account status through the client.
create function public.guard_user_profile_privileges() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if (new.role is distinct from old.role or new.status is distinct from old.status) and coalesce(auth.role(),'') <> 'service_role' and not public.is_app_admin() then
   raise exception 'Role and account status can only be changed by an authorized administrator.' using errcode='42501';
 end if;
 return new;
end; $$;
create trigger guard_user_profile_privileges before update on public.user_profiles for each row execute procedure public.guard_user_profile_privileges();

-- Expose only the curated view publicly, not the underlying table containing private fields.
revoke all on public.model_profiles from anon;
grant select on public.public_model_profiles to anon, authenticated;
grant select, insert, update on public.model_profiles to authenticated;
revoke all on public.audit_log from anon, authenticated;
grant select on public.audit_log to authenticated;


-- Enforce workflow transitions on the database, not only in the UI.
create function public.guard_model_profile_workflow() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if coalesce(auth.role(),'') <> 'service_role' and not public.is_app_admin() then
   if tg_op='INSERT' and new.status <> 'draft' then raise exception 'New model profiles must start as draft.' using errcode='42501'; end if;
   if tg_op='UPDATE' then
     if new.status is distinct from old.status and new.status not in ('draft','pending_review') then raise exception 'Only an administrator can publish, reject, or suspend a model profile.' using errcode='42501'; end if;
     if new.reviewed_by is distinct from old.reviewed_by or new.reviewed_at is distinct from old.reviewed_at or new.rejection_reason is distinct from old.rejection_reason then raise exception 'Review metadata is administrator-only.' using errcode='42501'; end if;
   end if;
 end if;
 return new;
end; $$;
create trigger guard_model_profile_workflow before insert or update on public.model_profiles for each row execute procedure public.guard_model_profile_workflow();

create function public.guard_comp_card_workflow() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if coalesce(auth.role(),'') <> 'service_role' and not public.is_app_admin() then
   if tg_op='INSERT' and new.status <> 'draft' then raise exception 'New Comp Cards must start as draft.' using errcode='42501'; end if;
   if tg_op='UPDATE' then
     if new.status is distinct from old.status and new.status not in ('draft','pending_review') then raise exception 'Only an administrator can approve or reject a Comp Card.' using errcode='42501'; end if;
     if new.validated_by is distinct from old.validated_by or new.validated_at is distinct from old.validated_at or new.rejection_reason is distinct from old.rejection_reason then raise exception 'Comp Card validation metadata is administrator-only.' using errcode='42501'; end if;
   end if;
 end if;
 return new;
end; $$;
create trigger guard_comp_card_workflow before insert or update on public.comp_cards for each row execute procedure public.guard_comp_card_workflow();

create function public.guard_casting_workflow() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if coalesce(auth.role(),'') <> 'service_role' and not public.is_app_admin() then
   if tg_op='INSERT' and new.status <> 'draft' then raise exception 'New castings must start as draft.' using errcode='42501'; end if;
   if tg_op='UPDATE' then
     if new.status is distinct from old.status and new.status not in ('draft','pending_payment') then raise exception 'Only trusted payment or administrator operations can change casting publication status.' using errcode='42501'; end if;
     if new.publication_fee_xof is distinct from old.publication_fee_xof then raise exception 'Casting fees are controlled by platform settings.' using errcode='42501'; end if;
     if new.published_at is distinct from old.published_at then raise exception 'Publication timestamp is administrator-only.' using errcode='42501'; end if;
   end if;
 end if;
 return new;
end; $$;
create trigger guard_casting_workflow before insert or update on public.castings for each row execute procedure public.guard_casting_workflow();

create function public.guard_shooting_workflow() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if coalesce(auth.role(),'') <> 'service_role' and not public.is_app_admin() then
   if tg_op='INSERT' and new.status <> 'received' then raise exception 'New shooting requests must start as received.' using errcode='42501'; end if;
   if tg_op='UPDATE' then
     if new.status is distinct from old.status then raise exception 'Shooting workflow status is administrator-only.' using errcode='42501'; end if;
     if new.assigned_photographer_id is distinct from old.assigned_photographer_id or new.reference_price_xof is distinct from old.reference_price_xof or new.discount_percent is distinct from old.discount_percent or new.discount_xof is distinct from old.discount_xof or new.proposed_price_xof is distinct from old.proposed_price_xof then raise exception 'Photographer assignment and pricing are administrator-only.' using errcode='42501'; end if;
   end if;
 end if;
 return new;
end; $$;
create trigger guard_shooting_workflow before insert or update on public.shooting_requests for each row execute procedure public.guard_shooting_workflow();

create view public.public_photographers with (security_invoker=false) as
 select id,professional_name,company_name,city,travel_areas,specialties,portfolio_urls,service_types
 from public.photographers where partnership_status='active';
revoke all on public.photographers from anon, authenticated;
grant select on public.public_photographers to anon, authenticated;
revoke all on public.shooting_requests from anon, authenticated;
grant select, insert on public.shooting_requests to authenticated;
revoke all on public.payments from anon, authenticated;
grant select on public.payments to authenticated;
revoke all on public.audit_log from anon, authenticated;
grant select on public.audit_log to authenticated;
revoke all on public.platform_settings from anon, authenticated;
grant select, update on public.platform_settings to authenticated;
revoke all on public.advertisers from anon;
grant select, insert, update on public.advertisers to authenticated;
revoke all on public.castings from anon;
grant select, insert, update on public.castings to authenticated;
revoke all on public.casting_applications from anon;
grant select, insert, update on public.casting_applications to authenticated;
revoke all on public.notifications from anon;
grant select, update on public.notifications to authenticated;
