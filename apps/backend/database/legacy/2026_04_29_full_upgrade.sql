-- 2026-04-29: Full upgrade batch (single file as requested)
-- Focus:
-- - Consultation persistence RPCs (open/save/close)
-- - Consultation documents + events (audit/timeline)
-- - Clinic speciality tools registry (OHIF per-speciality config)

begin;

-- =========================
-- Tables
-- =========================

create table if not exists public.consultation_documents (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  consultation_id uuid not null references public.consultations(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  uploader_id uuid null references public.users_metadata(id) on delete set null,

  kind text not null default 'file', -- file | pdf | image | scan | dicom
  name text not null,
  mime_type text null,
  url text null,
  size_bytes bigint null,
  sha256 text null,

  -- DICOM / OHIF launch metadata (optional)
  study_instance_uid text null,
  series_instance_uid text null,
  sop_instance_uid text null,
  accession_number text null,

  metadata jsonb null,

  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index if not exists idx_consultation_documents_consultation_created
  on public.consultation_documents (consultation_id, created_at desc);

create index if not exists idx_consultation_documents_patient_created
  on public.consultation_documents (patient_id, created_at desc);

create index if not exists idx_consultation_documents_clinic_created
  on public.consultation_documents (clinic_id, created_at desc);

drop trigger if exists trg_consultation_documents_updated on public.consultation_documents;
create trigger trg_consultation_documents_updated
before update on public.consultation_documents
for each row execute function public.update_updated_at();

create table if not exists public.consultation_events (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  consultation_id uuid not null references public.consultations(id) on delete cascade,
  actor_id uuid null references public.users_metadata(id) on delete set null,

  event_type text not null, -- opened | saved | closed | status_changed | note | document_added | document_removed
  payload jsonb null,

  created_at timestamp with time zone not null default now()
);

create index if not exists idx_consultation_events_consultation_created
  on public.consultation_events (consultation_id, created_at desc);

create index if not exists idx_consultation_events_clinic_created
  on public.consultation_events (clinic_id, created_at desc);

create table if not exists public.clinic_speciality_tools (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  speciality_key text not null, -- your normalized key (e.g. general, cardiology, dentistry...)
  tool_type text not null, -- ohif | 3d | link | custom
  label text null,
  base_url text null,
  config jsonb null,
  active boolean not null default true,

  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),

  unique (clinic_id, speciality_key, tool_type)
);

create index if not exists idx_clinic_speciality_tools_clinic
  on public.clinic_speciality_tools (clinic_id);

drop trigger if exists trg_clinic_speciality_tools_updated on public.clinic_speciality_tools;
create trigger trg_clinic_speciality_tools_updated
before update on public.clinic_speciality_tools
for each row execute function public.update_updated_at();

-- =========================
-- RPCs (consultation)
-- =========================

create or replace function public.rpc_open_consultation(
  p_requester_id uuid,
  p_appointment_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_clinic_id uuid;
  v_appt record;
  v_consult_id uuid;
  v_exists boolean;
  v_speciality_key text;
  v_result jsonb;
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
    insert into public.consultations (
      clinic_id,
      appointment_id,
      patient_id,
      doctor_id,
      status,
      speciality_key,
      opened_at,
      created_at,
      updated_at
    )
    values (
      v_clinic_id,
      p_appointment_id,
      v_appt.patient_id,
      v_appt.doctor_id,
      'open',
      v_speciality_key,
      now(),
      now(),
      now()
    )
    returning id into v_consult_id;

    insert into public.consultation_events (clinic_id, consultation_id, actor_id, event_type, payload)
    values (v_clinic_id, v_consult_id, p_requester_id, 'opened', jsonb_build_object('appointment_id', p_appointment_id));
  end if;

  -- If appointment is still pending, mark as in_consultation (best-effort)
  update public.appointments
  set status = case when status = 'pending' then 'in_consultation' else status end,
      updated_at = now()
  where id = p_appointment_id
    and clinic_id = v_clinic_id;

  select jsonb_build_object(
    'consultation', to_jsonb(c),
    'vitals', (select to_jsonb(v) from public.consultation_vitals v where v.consultation_id = c.id limit 1),
    'parameters', (select to_jsonb(p) from public.consultation_parameters p where p.consultation_id = c.id limit 1),
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
  where c.id = v_consult_id
    and c.clinic_id = v_clinic_id
  limit 1;

  return v_result;
end;
$$;

create or replace function public.rpc_save_consultation(
  p_requester_id uuid,
  p_consultation_id uuid,
  p_observations text default null,
  p_treatment_plan text default null,
  p_follow_up text default null,
  p_status text default null, -- open | closed
  p_vitals jsonb default null,
  p_parameters jsonb default null,
  p_diagnoses jsonb default null, -- array of {code,label,notes}
  p_speciality_key text default null,
  p_speciality_payload jsonb default null
)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_clinic_id uuid;
  v_row record;
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
  set
    observations = coalesce(p_observations, observations),
    treatment_plan = coalesce(p_treatment_plan, treatment_plan),
    follow_up = coalesce(p_follow_up, follow_up),
    status = coalesce(p_status, status),
    speciality_key = coalesce(p_speciality_key, speciality_key),
    speciality_payload = coalesce(p_speciality_payload, speciality_payload),
    closed_at = case
      when coalesce(p_status, status) = 'closed' then coalesce(closed_at, now())
      else closed_at
    end,
    updated_at = now()
  where id = p_consultation_id
    and clinic_id = v_clinic_id;

  if p_vitals is not null then
    insert into public.consultation_vitals (
      consultation_id,
      weight,
      height,
      temperature,
      systolic_bp,
      diastolic_bp,
      oxygen_saturation,
      bmi,
      recorded_at,
      created_at,
      updated_at
    )
    values (
      p_consultation_id,
      nullif(p_vitals->>'weight', '')::numeric,
      nullif(p_vitals->>'height', '')::numeric,
      nullif(p_vitals->>'temperature', '')::numeric,
      nullif(p_vitals->>'systolic_bp', '')::int,
      nullif(p_vitals->>'diastolic_bp', '')::int,
      nullif(p_vitals->>'oxygen_saturation', '')::int,
      nullif(p_vitals->>'bmi', '')::numeric,
      now(),
      now(),
      now()
    )
    on conflict (consultation_id) do update set
      weight = excluded.weight,
      height = excluded.height,
      temperature = excluded.temperature,
      systolic_bp = excluded.systolic_bp,
      diastolic_bp = excluded.diastolic_bp,
      oxygen_saturation = excluded.oxygen_saturation,
      bmi = excluded.bmi,
      updated_at = now();
  end if;

  if p_parameters is not null then
    insert into public.consultation_parameters (
      consultation_id,
      motif_consultation,
      glycemie,
      hba1c,
      examen_clinique,
      conclusion,
      created_at,
      updated_at
    )
    values (
      p_consultation_id,
      p_parameters->>'motif_consultation',
      p_parameters->>'glycemie',
      p_parameters->>'hba1c',
      p_parameters->>'examen_clinique',
      p_parameters->>'conclusion',
      now(),
      now()
    )
    on conflict (consultation_id) do update set
      motif_consultation = excluded.motif_consultation,
      glycemie = excluded.glycemie,
      hba1c = excluded.hba1c,
      examen_clinique = excluded.examen_clinique,
      conclusion = excluded.conclusion,
      updated_at = now();
  end if;

  if p_diagnoses is not null then
    -- Simple replace strategy (safe for prototype): delete + re-insert
    delete from public.consultation_diagnoses
    where consultation_id = p_consultation_id;

    insert into public.consultation_diagnoses (consultation_id, code, label, notes, created_at)
    select
      p_consultation_id,
      nullif(x->>'code',''),
      coalesce(x->>'label',''),
      nullif(x->>'notes',''),
      now()
    from jsonb_array_elements(p_diagnoses) as x;
  end if;

  insert into public.consultation_events (clinic_id, consultation_id, actor_id, event_type, payload)
  values (v_clinic_id, p_consultation_id, p_requester_id, 'saved', jsonb_build_object('status', coalesce(p_status, v_row.status)));

  return true;
end;
$$;

create or replace function public.rpc_close_consultation(
  p_requester_id uuid,
  p_consultation_id uuid
)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_clinic_id uuid;
  v_row record;
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
  set status = 'closed',
      closed_at = coalesce(closed_at, now()),
      updated_at = now()
  where id = p_consultation_id
    and clinic_id = v_clinic_id;

  update public.appointments
  set status = 'completed',
      updated_at = now()
  where id = v_row.appointment_id
    and clinic_id = v_clinic_id;

  insert into public.consultation_events (clinic_id, consultation_id, actor_id, event_type, payload)
  values (v_clinic_id, p_consultation_id, p_requester_id, 'closed', jsonb_build_object('appointment_id', v_row.appointment_id));

  return true;
end;
$$;

create or replace function public.rpc_get_consultation(
  p_requester_id uuid,
  p_consultation_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_clinic_id uuid;
  v_result jsonb;
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

  select jsonb_build_object(
    'consultation', to_jsonb(c),
    'vitals', (select to_jsonb(v) from public.consultation_vitals v where v.consultation_id = c.id limit 1),
    'parameters', (select to_jsonb(p) from public.consultation_parameters p where p.consultation_id = c.id limit 1),
    'diagnoses', (
      select coalesce(jsonb_agg(to_jsonb(d) order by d.created_at asc), '[]'::jsonb)
      from public.consultation_diagnoses d
      where d.consultation_id = c.id
    ),
    'documents', (
      select coalesce(jsonb_agg(to_jsonb(doc) order by doc.created_at desc), '[]'::jsonb)
      from public.consultation_documents doc
      where doc.consultation_id = c.id
    ),
    'events', (
      select coalesce(jsonb_agg(to_jsonb(e) order by e.created_at desc), '[]'::jsonb)
      from public.consultation_events e
      where e.consultation_id = c.id
    )
  )
  into v_result
  from public.consultations c
  where c.id = p_consultation_id
    and c.clinic_id = v_clinic_id
  limit 1;

  if v_result is null then
    raise exception 'Consultation not found or access denied';
  end if;

  return v_result;
end;
$$;

create or replace function public.rpc_get_consultations(
  p_requester_id uuid,
  p_search text default null,
  p_status text default null,
  p_start_date timestamp with time zone default null,
  p_end_date timestamp with time zone default null,
  p_page integer default 1,
  p_items_per_page integer default 10
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_clinic_id uuid;
  v_offset integer;
  v_total integer;
  v_rows jsonb;
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

  v_offset := greatest((p_page - 1) * p_items_per_page, 0);

  select count(*)
  into v_total
  from public.consultations c
  join public.appointments a on a.id = c.appointment_id
  join public.patients p on p.id = c.patient_id
  left join public.users_metadata d on d.id = c.doctor_id
  where c.clinic_id = v_clinic_id
    and (p_status is null or c.status = p_status)
    and (p_start_date is null or c.opened_at >= p_start_date)
    and (p_end_date is null or c.opened_at <= p_end_date)
    and (
      p_search is null
      or p.first_name ilike '%' || p_search || '%'
      or p.last_name ilike '%' || p_search || '%'
      or d.full_name ilike '%' || p_search || '%'
      or cast(c.appointment_id as text) ilike '%' || p_search || '%'
    );

  select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
  into v_rows
  from (
    select
      c.id as consultation_id,
      c.appointment_id,
      c.patient_id,
      c.doctor_id,
      c.status,
      c.speciality_key,
      c.opened_at,
      c.closed_at,
      a.scheduled_at,
      p.first_name as patient_first_name,
      p.last_name as patient_last_name,
      d.full_name as doctor_name
    from public.consultations c
    join public.appointments a on a.id = c.appointment_id
    join public.patients p on p.id = c.patient_id
    left join public.users_metadata d on d.id = c.doctor_id
    where c.clinic_id = v_clinic_id
      and (p_status is null or c.status = p_status)
      and (p_start_date is null or c.opened_at >= p_start_date)
      and (p_end_date is null or c.opened_at <= p_end_date)
      and (
        p_search is null
        or p.first_name ilike '%' || p_search || '%'
        or p.last_name ilike '%' || p_search || '%'
        or d.full_name ilike '%' || p_search || '%'
        or cast(c.appointment_id as text) ilike '%' || p_search || '%'
      )
    order by c.opened_at desc
    limit p_items_per_page
    offset v_offset
  ) t;

  return jsonb_build_object(
    'consultations', v_rows,
    'total', v_total,
    'page', p_page,
    'itemsPerPage', p_items_per_page
  );
end;
$$;

-- =========================
-- RPCs (speciality tools)
-- =========================

create or replace function public.rpc_get_clinic_speciality_tools(
  p_requester_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_clinic_id uuid;
  v_rows jsonb;
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

  select coalesce(jsonb_agg(to_jsonb(t) order by t.speciality_key asc), '[]'::jsonb)
  into v_rows
  from (
    select
      st.id,
      st.clinic_id,
      st.speciality_key,
      st.tool_type,
      st.label,
      st.base_url,
      st.config,
      st.active,
      st.created_at,
      st.updated_at
    from public.clinic_speciality_tools st
    where st.clinic_id = v_clinic_id
  ) t;

  return v_rows;
end;
$$;

create or replace function public.rpc_upsert_clinic_speciality_tool(
  p_requester_id uuid,
  p_speciality_key text,
  p_tool_type text,
  p_label text default null,
  p_base_url text default null,
  p_config jsonb default null,
  p_active boolean default true
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_clinic_id uuid;
  v_is_admin boolean;
  v_id uuid;
begin
  select clinic_id
  into v_clinic_id
  from public.users_metadata
  where id = p_requester_id
    and active = true
    and user_type = 'doctor'
  limit 1;

  if v_clinic_id is null then
    raise exception 'Requester has no clinic or is not a doctor';
  end if;

  select exists (
    select 1 from public.clinics c where c.id = v_clinic_id and c.admin_id = p_requester_id
  ) into v_is_admin;

  if not v_is_admin then
    raise exception 'Only clinic admin can edit speciality tools';
  end if;

  insert into public.clinic_speciality_tools (
    clinic_id,
    speciality_key,
    tool_type,
    label,
    base_url,
    config,
    active,
    created_at,
    updated_at
  )
  values (
    v_clinic_id,
    lower(trim(p_speciality_key)),
    lower(trim(p_tool_type)),
    p_label,
    p_base_url,
    p_config,
    coalesce(p_active, true),
    now(),
    now()
  )
  on conflict (clinic_id, speciality_key, tool_type) do update set
    label = excluded.label,
    base_url = excluded.base_url,
    config = excluded.config,
    active = excluded.active,
    updated_at = now()
  returning id into v_id;

  return v_id;
end;
$$;

commit;
