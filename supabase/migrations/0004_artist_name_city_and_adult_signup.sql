-- Registration privacy and age gate: artist name is public-facing; legal names and birth date are not persisted.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_birth_date date;
  v_artist_name text;
  v_city text;
  v_country text;
begin
  begin
    v_birth_date := nullif(new.raw_user_meta_data->>'birth_date', '')::date;
  exception when others then
    raise exception 'A valid date of birth is required.' using errcode = '22007';
  end;

  if v_birth_date is null then
    raise exception 'A date of birth is required.' using errcode = '23514';
  end if;

  if v_birth_date > (current_date - interval '18 years')::date then
    raise exception 'You must be at least 18 years old to register.' using errcode = '23514';
  end if;

  v_artist_name := nullif(trim(new.raw_user_meta_data->>'artist_name'), '');
  if v_artist_name is null then
    raise exception 'An artist name is required.' using errcode = '23514';
  end if;

  v_city := nullif(trim(new.raw_user_meta_data->>'city'), '');
  v_country := nullif(trim(new.raw_user_meta_data->>'country'), '');

  insert into public.user_profiles(id, role, status, first_name, last_name, email)
  values(new.id, 'model', 'pending', '', '', coalesce(new.email, ''))
  on conflict(id) do nothing;

  insert into public.model_profiles(user_id, display_name, city, country, status)
  values(new.id, v_artist_name, coalesce(v_city, 'Dakar'), coalesce(v_country, 'Sénégal'), 'draft')
  on conflict(user_id) do nothing;

  return new;
end;
$function$;
