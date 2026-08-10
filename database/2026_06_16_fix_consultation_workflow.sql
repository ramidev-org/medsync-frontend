-- Fix appointment/consultation workflow enum handling and consultation lineage columns.

do $$
begin
  if not exists (
    select 1
    from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'appointment_status_enum'
      and e.enumlabel = 'in_consultation'
  ) then
    alter type public.appointment_status_enum add value 'in_consultation';
  end if;
end
$$;

create or replace function public.rpc_create_appointment(
  p_requester_id uuid,
  p_patient_id uuid,
  p_doctor_id uuid,
  p_scheduled_at timestamp with time zone,
  p_status text default 'pending'::text,
  p_type text default 'consultation'::text,
  p_notes text default null::text
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_clinic_id uuid;
  v_appointment_id uuid;
begin
  if auth.uid() is null or auth.uid() <> p_requester_id then
    raise exception 'Unauthorized requester' using errcode = '42501';
  end if;

  select clinic_id
  into v_clinic_id
  from public.users_metadata
  where id = p_requester_id
    and active = true
  limit 1;

  if v_clinic_id is null then
    raise exception 'Requester has no clinic';
  end if;

  if not exists (
    select 1
    from public.patients
    where id = p_patient_id
      and clinic_id = v_clinic_id
  ) then
    raise exception 'Patient not found or access denied';
  end if;

  if not exists (
    select 1
    from public.users_metadata
    where id = p_doctor_id
      and clinic_id = v_clinic_id
      and user_type = 'doctor'
      and active = true
  ) then
    raise exception 'Doctor not found or access denied';
  end if;

  insert into public.appointments (
    clinic_id,
    patient_id,
    doctor_id,
    scheduled_at,
    status,
    type,
    notes,
    created_at,
    updated_at
  )
  values (
    v_clinic_id,
    p_patient_id,
    p_doctor_id,
    p_scheduled_at,
    coalesce(nullif(btrim(p_status), ''), 'pending')::public.appointment_status_enum,
    coalesce(nullif(btrim(p_type), ''), 'consultation')::public.appointment_type_enum,
    nullif(p_notes, ''),
    now(),
    now()
  )
  returning id into v_appointment_id;

  return v_appointment_id;
end;
$function$;

create or replace function public.rpc_update_appointment(
  p_requester_id uuid,
  p_appointment_id uuid,
  p_doctor_id uuid default null::uuid,
  p_scheduled_at timestamp with time zone default null::timestamp with time zone,
  p_status text default null::text,
  p_type text default null::text,
  p_notes text default null::text
)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_clinic_id uuid;
begin
  if auth.uid() is null or auth.uid() <> p_requester_id then
    raise exception 'Unauthorized requester' using errcode = '42501';
  end if;

  select clinic_id
  into v_clinic_id
  from public.users_metadata
  where id = p_requester_id
    and active = true
  limit 1;

  if v_clinic_id is null then
    raise exception 'Requester has no clinic';
  end if;

  if not exists (
    select 1
    from public.appointments
    where id = p_appointment_id
      and clinic_id = v_clinic_id
  ) then
    raise exception 'Appointment not found or access denied';
  end if;

  if p_doctor_id is not null then
    if not exists (
      select 1
      from public.users_metadata
      where id = p_doctor_id
        and clinic_id = v_clinic_id
        and user_type = 'doctor'
        and active = true
    ) then
      raise exception 'Doctor not found or access denied';
    end if;
  end if;

  update public.appointments
  set
    doctor_id = coalesce(p_doctor_id, doctor_id),
    scheduled_at = coalesce(p_scheduled_at, scheduled_at),
    status = case
      when p_status is null or btrim(p_status) = '' then status
      else p_status::public.appointment_status_enum
    end,
    type = case
      when p_type is null or btrim(p_type) = '' then type
      else p_type::public.appointment_type_enum
    end,
    notes = case
      when p_notes is null then notes
      else nullif(p_notes, '')
    end,
    updated_at = now()
  where id = p_appointment_id
    and clinic_id = v_clinic_id;

  return true;
end;
$function$;

create or replace function public.rpc_cancel_appointment(
  p_requester_id uuid,
  p_appointment_id uuid
)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_clinic_id uuid;
begin
  if auth.uid() is null or auth.uid() <> p_requester_id then
    raise exception 'Unauthorized requester' using errcode = '42501';
  end if;

  select clinic_id
  into v_clinic_id
  from public.users_metadata
  where id = p_requester_id
    and active = true
  limit 1;

  if v_clinic_id is null then
    raise exception 'Requester has no clinic';
  end if;

  update public.appointments
  set
    status = 'cancelled'::public.appointment_status_enum,
    updated_at = now()
  where id = p_appointment_id
    and clinic_id = v_clinic_id;

  if not found then
    raise exception 'Appointment not found or access denied';
  end if;

  return true;
end;
$function$;

create or replace function public.rpc_open_consultation(
  p_requester_id uuid,
  p_appointment_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_clinic_id uuid;
  v_appt record;
  v_consult_id uuid;
  v_exists boolean;
  v_speciality_key text;
  v_result jsonb;
begin
  if auth.uid() is null or auth.uid() <> p_requester_id then
    raise exception 'Unauthorized requester' using errcode = '42501';
  end if;

  select clinic_id
  into v_clinic_id
  from public.users_metadata
  where id = p_requester_id
    and active = true
  limit 1;

  if v_clinic_id is null then
    raise exception 'Requester has no clinic';
  end if;

  select *
  into v_appt
  from public.appointments
  where id = p_appointment_id
    and clinic_id = v_clinic_id
  limit 1;

  if v_appt.id is null then
    raise exception 'Appointment not found or access denied';
  end if;

  select dp.speciality
  into v_speciality_key
  from public.doctor_profiles dp
  where dp.id = v_appt.doctor_id
  limit 1;

  select exists(
    select 1 from public.consultations c where c.appointment_id = p_appointment_id
  ) into v_exists;

  if v_exists then
    select c.id into v_consult_id
    from public.consultations c
    where c.appointment_id = p_appointment_id
    limit 1;
  else
    v_consult_id := gen_random_uuid();

    insert into public.consultations (
      id,
      clinic_id,
      appointment_id,
      patient_id,
      doctor_id,
      status,
      speciality_key,
      root_consultation_id,
      sequence_position,
      session_number,
      session_type,
      is_parent,
      opened_at,
      created_at,
      updated_at
    )
    values (
      v_consult_id,
      v_clinic_id,
      p_appointment_id,
      v_appt.patient_id,
      v_appt.doctor_id,
      'open'::public.consultation_status_enum,
      coalesce(v_speciality_key, 'general_medicine'),
      v_consult_id,
      1,
      1,
      'initial',
      true,
      now(),
      now(),
      now()
    );

    insert into public.consultation_events (clinic_id, consultation_id, actor_id, event_type, payload)
    values (v_clinic_id, v_consult_id, p_requester_id, 'opened', jsonb_build_object('appointment_id', p_appointment_id));
  end if;

  update public.appointments
  set
    status = case
      when status::text = 'pending' then 'in_consultation'::public.appointment_status_enum
      else status
    end,
    updated_at = now()
  where id = p_appointment_id
    and clinic_id = v_clinic_id;

  select jsonb_build_object(
    'consultation', to_jsonb(c),
    'vitals', null,
    'parameters', null,
    'observations', coalesce(o.data, c.observation_data, '{}'::jsonb),
    'diagnoses', (
      select coalesce(jsonb_agg(to_jsonb(d) order by d.created_at asc), '[]'::jsonb)
      from public.consultation_diagnoses d
      where d.consultation_id = c.id
    ),
    'documents', (
      select coalesce(jsonb_agg(to_jsonb(doc) order by doc.created_at desc), '[]'::jsonb)
      from public.consultation_documents doc
      where doc.consultation_id = c.id
    )
  )
  into v_result
  from public.consultations c
  left join public.consultation_observations o
    on o.consultation_id = c.id
  where c.id = v_consult_id
    and c.clinic_id = v_clinic_id
  limit 1;

  return v_result;
end;
$function$;

create or replace function public.rpc_create_followup_consultation(
  p_treatment_case_id uuid,
  p_doctor_id uuid,
  p_reason_for_visit text default null::text,
  p_session_title text default null::text
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_case record;
  v_requester_clinic_id uuid;
  v_first_consultation_id uuid;
  v_previous_consultation_id uuid;
  v_previous_root_id uuid;
  v_next_session_number integer;
  v_new_consultation_id uuid;
begin
  select clinic_id
  into v_requester_clinic_id
  from public.users_metadata
  where id = auth.uid()
    and active = true
  limit 1;

  if v_requester_clinic_id is null then
    raise exception 'Unauthorized requester' using errcode = '42501';
  end if;

  select *
  into v_case
  from public.treatment_cases
  where id = p_treatment_case_id
    and clinic_id = v_requester_clinic_id
  limit 1;

  if v_case.id is null then
    raise exception 'Treatment case not found or access denied';
  end if;

  if p_doctor_id is not null and not exists (
    select 1
    from public.users_metadata
    where id = p_doctor_id
      and clinic_id = v_requester_clinic_id
      and user_type = 'doctor'::public.user_type_enum
      and active = true
  ) then
    raise exception 'Doctor not found or access denied';
  end if;

  select id, root_consultation_id
  into v_first_consultation_id, v_previous_root_id
  from public.consultations
  where treatment_case_id = p_treatment_case_id
  order by session_number asc nulls last, opened_at asc
  limit 1;

  select id, coalesce(session_number, 1) + 1
  into v_previous_consultation_id, v_next_session_number
  from public.consultations
  where treatment_case_id = p_treatment_case_id
  order by session_number desc nulls last, opened_at desc
  limit 1;

  v_next_session_number := coalesce(v_next_session_number, 1);
  v_new_consultation_id := gen_random_uuid();

  insert into public.consultations (
    id,
    clinic_id,
    appointment_id,
    patient_id,
    doctor_id,
    status,
    observations,
    treatment_plan,
    follow_up,
    speciality_key,
    speciality_payload,
    shared_payload,
    treatment_case_id,
    parent_consultation_id,
    previous_consultation_id,
    session_number,
    session_type,
    is_parent,
    session_title,
    reason_for_visit,
    root_consultation_id,
    sequence_position,
    opened_at,
    created_at,
    updated_at
  )
  values (
    v_new_consultation_id,
    v_case.clinic_id,
    null,
    v_case.patient_id,
    coalesce(p_doctor_id, v_case.doctor_id),
    'open'::public.consultation_status_enum,
    null,
    null,
    null,
    v_case.speciality_key,
    '{}'::jsonb,
    '{}'::jsonb,
    p_treatment_case_id,
    v_first_consultation_id,
    v_previous_consultation_id,
    v_next_session_number,
    case when v_next_session_number = 1 then 'initial' else 'follow_up' end,
    case when v_next_session_number = 1 then true else false end,
    p_session_title,
    p_reason_for_visit,
    coalesce(v_previous_root_id, v_new_consultation_id),
    v_next_session_number,
    now(),
    now(),
    now()
  );

  update public.treatment_cases
  set
    first_consultation_id = coalesce(first_consultation_id, v_new_consultation_id),
    last_consultation_id = v_new_consultation_id,
    updated_at = now()
  where id = p_treatment_case_id;

  return v_new_consultation_id;
end;
$function$;

create or replace function public.rpc_close_consultation(
  p_requester_id uuid,
  p_consultation_id uuid
)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_clinic_id uuid;
  v_row record;
begin
  if auth.uid() is null or auth.uid() <> p_requester_id then
    raise exception 'Unauthorized requester' using errcode = '42501';
  end if;

  select clinic_id
  into v_clinic_id
  from public.users_metadata
  where id = p_requester_id
    and active = true
  limit 1;

  if v_clinic_id is null then
    raise exception 'Requester has no clinic';
  end if;

  select c.*
  into v_row
  from public.consultations c
  where c.id = p_consultation_id
    and c.clinic_id = v_clinic_id
  limit 1;

  if v_row.id is null then
    raise exception 'Consultation not found or access denied';
  end if;

  update public.consultations
  set status = 'closed'::public.consultation_status_enum,
      closed_at = coalesce(closed_at, now()),
      updated_at = now()
  where id = p_consultation_id
    and clinic_id = v_clinic_id;

  update public.appointments
  set status = 'completed'::public.appointment_status_enum,
      updated_at = now()
  where id = v_row.appointment_id
    and clinic_id = v_clinic_id;

  insert into public.consultation_events (clinic_id, consultation_id, actor_id, event_type, payload)
  values (v_clinic_id, p_consultation_id, p_requester_id, 'closed', jsonb_build_object('appointment_id', v_row.appointment_id));

  return true;
end;
$function$;

grant execute on function public.rpc_create_appointment(
  uuid,
  uuid,
  uuid,
  timestamp with time zone,
  text,
  text,
  text
) to authenticated;

grant execute on function public.rpc_update_appointment(
  uuid,
  uuid,
  uuid,
  timestamp with time zone,
  text,
  text,
  text
) to authenticated;

grant execute on function public.rpc_cancel_appointment(
  uuid,
  uuid
) to authenticated;

grant execute on function public.rpc_open_consultation(
  uuid,
  uuid
) to authenticated;

grant execute on function public.rpc_create_followup_consultation(
  uuid,
  uuid,
  text,
  text
) to authenticated;

grant execute on function public.rpc_close_consultation(
  uuid,
  uuid
) to authenticated;
