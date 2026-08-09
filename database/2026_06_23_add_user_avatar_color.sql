-- Apply this in Supabase SQL editor, then refresh the app.

alter table public.users_metadata
  add column if not exists avatar_color text not null default '#2DA8D8';

update public.users_metadata
set avatar_color = '#2DA8D8'
where avatar_color is null
   or btrim(avatar_color) = '';

create or replace function public.rpc_update_my_profile(
  p_requester_id uuid,
  p_full_name text default null,
  p_username text default null,
  p_avatar_color text default null,
  p_doctor_speciality text default null,
  p_doctor_license_number text default null,
  p_doctor_years_of_experience integer default null,
  p_doctor_consultation_fee numeric default null,
  p_doctor_bio text default null,
  p_assistant_department text default null,
  p_assistant_shift_start time without time zone default null,
  p_assistant_shift_end time without time zone default null
)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_user_type public.user_type_enum;
  v_clinic_id uuid;
begin
  select user_type, clinic_id
  into v_user_type, v_clinic_id
  from public.users_metadata
  where id = p_requester_id
    and active = true
  limit 1;

  if v_user_type is null then
    raise exception 'Requester not found or inactive';
  end if;

  update public.users_metadata
  set
    full_name = coalesce(nullif(btrim(p_full_name), ''), full_name),
    username = coalesce(nullif(btrim(p_username), ''), username),
    avatar_color = case
      when p_avatar_color is null or btrim(p_avatar_color) = '' then avatar_color
      when btrim(p_avatar_color) ~* '^#?[0-9a-f]{6}$' then
        upper(case when left(btrim(p_avatar_color), 1) = '#' then btrim(p_avatar_color) else '#' || btrim(p_avatar_color) end)
      else avatar_color
    end
  where id = p_requester_id;

  insert into public.profiles (
    id,
    clinic_id,
    user_type,
    speciality,
    active,
    created_at,
    updated_at
  )
  values (
    p_requester_id,
    v_clinic_id,
    v_user_type,
    case
      when v_user_type = 'doctor'::public.user_type_enum
      then coalesce(nullif(btrim(p_doctor_speciality), ''), 'general_medicine')
      else null
    end,
    true,
    now(),
    now()
  )
  on conflict (id) do nothing;

  if v_user_type = 'doctor'::public.user_type_enum then
    update public.profiles
    set
      speciality = coalesce(nullif(btrim(p_doctor_speciality), ''), speciality, 'general_medicine'),
      license_number = coalesce(nullif(btrim(p_doctor_license_number), ''), license_number),
      years_of_experience = coalesce(p_doctor_years_of_experience, years_of_experience),
      consultation_fee = coalesce(p_doctor_consultation_fee, consultation_fee),
      bio = coalesce(nullif(btrim(p_doctor_bio), ''), bio),
      updated_at = now()
    where id = p_requester_id
      and user_type = 'doctor'::public.user_type_enum;
  else
    update public.profiles
    set
      department = coalesce(nullif(btrim(p_assistant_department), ''), department),
      shift_start = coalesce(p_assistant_shift_start, shift_start),
      shift_end = coalesce(p_assistant_shift_end, shift_end),
      updated_at = now()
    where id = p_requester_id
      and user_type = 'assistant'::public.user_type_enum;
  end if;

  return true;
end;
$function$;

create or replace function public.rpc_get_conversations(
  p_requester_id uuid,
  p_page integer default 1,
  p_items_per_page integer default 30
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_clinic_id uuid;
  v_offset integer;
  v_total integer;
  v_rows jsonb;
begin
  select clinic_id into v_clinic_id
  from public.users_metadata
  where id = p_requester_id and active = true
  limit 1;

  if v_clinic_id is null then
    raise exception 'Requester has no clinic';
  end if;

  v_offset := greatest((p_page - 1) * p_items_per_page, 0);

  select count(*) into v_total
  from public.clinic_conversation_members m
  join public.clinic_conversations c on c.id = m.conversation_id
  where m.user_id = p_requester_id
    and c.clinic_id = v_clinic_id;

  select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
  into v_rows
  from (
    select
      c.id,
      c.clinic_id,
      c.kind,
      c.title,
      c.created_by,
      c.created_at,
      c.updated_at,
      (
        select jsonb_build_object(
          'id', msg.id,
          'sender_id', msg.sender_id,
          'body', msg.body,
          'created_at', msg.created_at
        )
        from public.clinic_messages msg
        where msg.conversation_id = c.id
        order by msg.created_at desc
        limit 1
      ) as last_message,
      (
        select coalesce(
          jsonb_agg(
            jsonb_build_object(
              'id', um.id,
              'full_name', um.full_name,
              'avatar_color', um.avatar_color,
              'user_type', um.user_type
            )
            order by um.full_name
          ),
          '[]'::jsonb
        )
        from public.clinic_conversation_members mm
        join public.users_metadata um on um.id = mm.user_id
        where mm.conversation_id = c.id
      ) as members
    from public.clinic_conversations c
    join public.clinic_conversation_members m on m.conversation_id = c.id
    where m.user_id = p_requester_id
      and c.clinic_id = v_clinic_id
    order by coalesce((select max(created_at) from public.clinic_messages msg where msg.conversation_id = c.id), c.updated_at) desc
    limit p_items_per_page
    offset v_offset
  ) t;

  return jsonb_build_object(
    'conversations', v_rows,
    'total', v_total,
    'page', p_page,
    'itemsPerPage', p_items_per_page
  );
end;
$function$;

create or replace function public.rpc_get_clinic_staff(p_requester_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_clinic_id uuid;
  v_staff jsonb;
begin
  select clinic_id
  into v_clinic_id
  from public.users_metadata
  where id = p_requester_id
    and active = true
  limit 1;

  if v_clinic_id is null then
    raise exception 'Requester has no clinic';
  end if;

  select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
  into v_staff
  from (
    select
      um.id,
      um.username,
      um.full_name,
      um.email,
      um.avatar_color,
      um.user_type,
      um.active,
      dp.speciality,
      dp.license_number,
      dp.years_of_experience,
      dp.consultation_fee,
      ap.department,
      ap.shift_start,
      ap.shift_end
    from public.users_metadata um
    left join public.doctor_profiles dp on dp.id = um.id
    left join public.assistant_profiles ap on ap.id = um.id
    where um.clinic_id = v_clinic_id
    order by um.created_at desc
  ) t;

  return v_staff;
end;
$function$;
