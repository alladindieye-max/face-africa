create or replace function public.guard_model_profile_entitlements()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_app_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.membership_tier := 'BASIC';
    new.is_verified := false;
    new.is_featured := false;
    return new;
  end if;

  if new.membership_tier is distinct from old.membership_tier then
    raise exception 'Only FACEAFRICA can change a membership tier';
  end if;
  if new.is_verified is distinct from old.is_verified then
    raise exception 'Only FACEAFRICA can verify a mannequin';
  end if;
  if new.is_featured is distinct from old.is_featured then
    raise exception 'Only FACEAFRICA can feature a mannequin';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_model_profile_entitlements on public.model_profiles;
create trigger guard_model_profile_entitlements
before insert or update on public.model_profiles
for each row execute function public.guard_model_profile_entitlements();

create or replace function public.guard_model_photo_moderation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_id uuid;
begin
  if public.is_app_admin() then
    return new;
  end if;

  select m.user_id into owner_id
  from public.model_profiles m
  where m.id = coalesce(new.model_profile_id, old.model_profile_id);

  if owner_id is distinct from auth.uid() then
    raise exception 'You can only manage photos attached to your own mannequin profile';
  end if;

  if tg_op = 'INSERT' then
    new.moderation_status := 'pending';
    return new;
  end if;

  if new.moderation_status is distinct from old.moderation_status then
    raise exception 'Only FACEAFRICA can change photo moderation status';
  end if;

  if new.model_profile_id is distinct from old.model_profile_id then
    raise exception 'A photo cannot be moved to another mannequin profile';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_model_photo_moderation on public.model_photos;
create trigger guard_model_photo_moderation
before insert or update on public.model_photos
for each row execute function public.guard_model_photo_moderation();

revoke execute on function public.guard_model_profile_entitlements() from public, anon, authenticated;
revoke execute on function public.guard_model_photo_moderation() from public, anon, authenticated;
