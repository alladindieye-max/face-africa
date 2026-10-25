-- Allow mannequin owners to edit details on an already-published profile without changing its publication status.
-- Owners may submit drafts/rejected profiles for review, but cannot publish, reject, or suspend profiles themselves.
create or replace function public.guard_model_profile_workflow()
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
    if new.user_id is distinct from auth.uid() then
      raise exception 'You can only create your own mannequin profile';
    end if;
    if new.status <> 'draft'::public.model_profile_status then
      raise exception 'A new mannequin profile must start as a draft';
    end if;
    if new.reviewed_by is not null or new.reviewed_at is not null then
      raise exception 'Only FACEAFRICA can validate a mannequin profile';
    end if;
    return new;
  end if;

  if old.user_id is distinct from auth.uid() then
    raise exception 'You can only edit your own mannequin profile';
  end if;

  if new.user_id is distinct from old.user_id then
    raise exception 'A mannequin profile owner cannot be changed';
  end if;

  if new.reviewed_by is distinct from old.reviewed_by
     or new.reviewed_at is distinct from old.reviewed_at then
    raise exception 'Only FACEAFRICA can change profile review details';
  end if;

  if new.status is distinct from old.status
     and not (
       old.status in ('draft'::public.model_profile_status, 'rejected'::public.model_profile_status)
       and new.status = 'pending_review'::public.model_profile_status
     ) then
    raise exception 'Only FACEAFRICA can publish, reject, or suspend a mannequin profile';
  end if;

  return new;
end;
$$;
