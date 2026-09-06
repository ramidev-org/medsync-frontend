-- Backend for consultation ordonnances.
-- Safe to run on both fresh and older Supabase schemas.

create table if not exists public.prescriptions (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid null references public.clinics(id) on delete cascade,
  consultation_id uuid not null references public.consultations(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  doctor_id uuid null references public.users_metadata(id) on delete set null,
  template_name text null,
  signed_by text null,
  treatment_case_id uuid null references public.treatment_cases(id) on delete set null,
  status text not null default 'draft',
  notes text null,
  signed_at timestamp with time zone null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint prescriptions_status_check check (status in ('draft', 'signed', 'cancelled'))
);

alter table public.prescriptions
  add column if not exists clinic_id uuid null references public.clinics(id) on delete cascade,
  add column if not exists consultation_id uuid null references public.consultations(id) on delete cascade,
  add column if not exists patient_id uuid null references public.patients(id) on delete cascade,
  add column if not exists doctor_id uuid null references public.users_metadata(id) on delete set null,
  add column if not exists template_name text null,
  add column if not exists signed_by text null,
  add column if not exists treatment_case_id uuid null references public.treatment_cases(id) on delete set null,
  add column if not exists status text null default 'draft',
  add column if not exists notes text null,
  add column if not exists signed_at timestamp with time zone null,
  add column if not exists created_at timestamp with time zone null default now(),
  add column if not exists updated_at timestamp with time zone null default now();

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'prescriptions'
      and column_name = 'status'
      and udt_name = 'prescription_status_enum'
  ) then
    alter table public.prescriptions
      alter column status drop default;

    alter table public.prescriptions
      alter column status type text
      using status::text;

    alter table public.prescriptions
      alter column status set default 'draft';
  end if;
end
$$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'prescriptions'
      and column_name = 'status'
  ) then
    update public.prescriptions
    set status = 'draft'
    where status is null or btrim(status::text) = '';
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'prescriptions_status_check'
      and conrelid = 'public.prescriptions'::regclass
  ) then
    alter table public.prescriptions
      add constraint prescriptions_status_check
      check (status in ('draft', 'signed', 'cancelled'));
  end if;
end
$$;

update public.prescriptions p
set clinic_id = c.clinic_id
from public.consultations c
where p.consultation_id = c.id
  and p.clinic_id is null;

update public.prescriptions
set created_at = now()
where created_at is null;

update public.prescriptions
set updated_at = coalesce(updated_at, created_at, now())
where updated_at is null;

create index if not exists prescriptions_clinic_patient_idx
  on public.prescriptions (clinic_id, patient_id, created_at desc);

create index if not exists prescriptions_consultation_idx
  on public.prescriptions (consultation_id, created_at desc);

create table if not exists public.prescription_medication_rows (
  id uuid primary key default gen_random_uuid(),
  prescription_id uuid not null references public.prescriptions(id) on delete cascade,
  catalog_id text null,
  medicine_name text not null,
  quantity integer not null default 1,
  dose text null,
  frequency text null,
  duration text null,
  instructions text null,
  created_at timestamp with time zone not null default now()
);

alter table public.prescription_medication_rows
  add column if not exists prescription_id uuid null references public.prescriptions(id) on delete cascade,
  add column if not exists catalog_id text null,
  add column if not exists medicine_name text null,
  add column if not exists quantity integer not null default 1,
  add column if not exists dose text null,
  add column if not exists frequency text null,
  add column if not exists duration text null,
  add column if not exists instructions text null,
  add column if not exists created_at timestamp with time zone null default now();

update public.prescription_medication_rows
set created_at = now()
where created_at is null;

create index if not exists prescription_medication_rows_prescription_idx
  on public.prescription_medication_rows (prescription_id, created_at asc);

create or replace function public.rpc_get_prescriptions(
  p_requester_id uuid,
  p_consultation_id uuid default null,
  p_patient_id uuid default null,
  p_limit integer default 20
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_clinic_id uuid;
  v_rows jsonb;
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

  select coalesce(jsonb_agg(to_jsonb(t) order by t.created_at desc), '[]'::jsonb)
  into v_rows
  from (
    select
      p.id,
      p.consultation_id,
      p.patient_id,
      p.doctor_id,
      p.template_name,
      p.signed_by,
      p.created_at,
      p.updated_at,
      p.treatment_case_id,
      p.status,
      p.notes,
      p.signed_at,
      (
        select coalesce(jsonb_agg(to_jsonb(m) order by m.created_at asc), '[]'::jsonb)
        from (
          select
            pm.id,
            pm.catalog_id,
            pm.medicine_name,
            pm.quantity,
            pm.dose,
            pm.frequency,
            pm.duration,
            pm.instructions,
            pm.created_at
          from public.prescription_medication_rows pm
          where pm.prescription_id = p.id
        ) m
      ) as medications
    from public.prescriptions p
    join public.consultations c on c.id = p.consultation_id
    where c.clinic_id = v_clinic_id
      and (p_consultation_id is null or p.consultation_id = p_consultation_id)
      and (p_patient_id is null or p.patient_id = p_patient_id)
    order by p.created_at desc
    limit greatest(coalesce(p_limit, 20), 1)
  ) t;

  return v_rows;
end;
$function$;

create or replace function public.rpc_upsert_prescription(
  p_requester_id uuid,
  p_consultation_id uuid,
  p_patient_id uuid,
  p_prescription_id uuid default null,
  p_template_name text default null,
  p_signed_by text default null,
  p_status text default 'draft',
  p_notes text default null,
  p_medications jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_clinic_id uuid;
  v_requester_type public.user_type_enum;
  v_consultation record;
  v_prescription_id uuid;
  v_row jsonb;
  v_status text;
  v_signed_at timestamp with time zone;
  v_item jsonb;
begin
  if auth.uid() is null or auth.uid() <> p_requester_id then
    raise exception 'Unauthorized requester' using errcode = '42501';
  end if;

  select clinic_id, user_type
  into v_clinic_id, v_requester_type
  from public.users_metadata
  where id = p_requester_id
    and active = true
  limit 1;

  if v_clinic_id is null then
    raise exception 'Requester has no clinic';
  end if;

  select id, clinic_id, patient_id, doctor_id, treatment_case_id
  into v_consultation
  from public.consultations
  where id = p_consultation_id
    and clinic_id = v_clinic_id
  limit 1;

  if v_consultation.id is null then
    raise exception 'Consultation not found or access denied';
  end if;

  if v_consultation.patient_id <> p_patient_id then
    raise exception 'Prescription patient does not match consultation patient';
  end if;

  if jsonb_typeof(coalesce(p_medications, '[]'::jsonb)) <> 'array' then
    raise exception 'p_medications must be a JSON array';
  end if;

  v_status := lower(coalesce(nullif(btrim(p_status), ''), 'draft'));
  if v_status not in ('draft', 'signed', 'cancelled') then
    raise exception 'Invalid prescription status';
  end if;

  v_signed_at := case when v_status = 'signed' then now() else null end;

  if p_prescription_id is null then
    insert into public.prescriptions (
      clinic_id,
      consultation_id,
      patient_id,
      doctor_id,
      template_name,
      signed_by,
      treatment_case_id,
      status,
      notes,
      signed_at,
      created_at,
      updated_at
    )
    values (
      v_consultation.clinic_id,
      p_consultation_id,
      p_patient_id,
      case when v_requester_type = 'doctor' then p_requester_id else v_consultation.doctor_id end,
      nullif(btrim(p_template_name), ''),
      nullif(btrim(p_signed_by), ''),
      v_consultation.treatment_case_id,
      v_status,
      nullif(p_notes, ''),
      v_signed_at,
      now(),
      now()
    )
    returning id into v_prescription_id;
  else
    if not exists (
      select 1
      from public.prescriptions p
      join public.consultations c on c.id = p.consultation_id
      where p.id = p_prescription_id
        and c.clinic_id = v_clinic_id
        and p.consultation_id = p_consultation_id
    ) then
      raise exception 'Prescription not found or access denied';
    end if;

    update public.prescriptions
    set
      clinic_id = coalesce(clinic_id, v_consultation.clinic_id),
      patient_id = p_patient_id,
      doctor_id = case when v_requester_type = 'doctor' then p_requester_id else coalesce(doctor_id, v_consultation.doctor_id) end,
      template_name = nullif(btrim(p_template_name), ''),
      signed_by = nullif(btrim(p_signed_by), ''),
      treatment_case_id = v_consultation.treatment_case_id,
      status = v_status,
      notes = nullif(p_notes, ''),
      signed_at = case
        when v_status = 'signed' then coalesce(signed_at, now())
        else null
      end,
      updated_at = now()
    where id = p_prescription_id;

    v_prescription_id := p_prescription_id;

    delete from public.prescription_medication_rows
    where prescription_id = v_prescription_id;
  end if;

  for v_item in
    select value
    from jsonb_array_elements(coalesce(p_medications, '[]'::jsonb))
  loop
    insert into public.prescription_medication_rows (
      prescription_id,
      catalog_id,
      medicine_name,
      quantity,
      dose,
      frequency,
      duration,
      instructions,
      created_at
    )
    values (
      v_prescription_id,
      nullif(v_item->>'catalog_id', ''),
      coalesce(nullif(btrim(v_item->>'medicine_name'), ''), 'Medication'),
      greatest(coalesce((v_item->>'quantity')::integer, 1), 1),
      nullif(v_item->>'dose', ''),
      nullif(v_item->>'frequency', ''),
      nullif(v_item->>'duration', ''),
      nullif(v_item->>'instructions', ''),
      now()
    );
  end loop;

  select to_jsonb(t)
  into v_row
  from (
    select
      p.id,
      p.consultation_id,
      p.patient_id,
      p.doctor_id,
      p.template_name,
      p.signed_by,
      p.created_at,
      p.updated_at,
      p.treatment_case_id,
      p.status,
      p.notes,
      p.signed_at,
      (
        select coalesce(jsonb_agg(to_jsonb(m) order by m.created_at asc), '[]'::jsonb)
        from (
          select
            pm.id,
            pm.catalog_id,
            pm.medicine_name,
            pm.quantity,
            pm.dose,
            pm.frequency,
            pm.duration,
            pm.instructions,
            pm.created_at
          from public.prescription_medication_rows pm
          where pm.prescription_id = p.id
        ) m
      ) as medications
    from public.prescriptions p
    join public.consultations c on c.id = p.consultation_id
    where p.id = v_prescription_id
      and c.clinic_id = v_clinic_id
    limit 1
  ) t;

  if v_row is null then
    raise exception 'Prescription save failed';
  end if;

  return v_row;
end;
$function$;

grant execute on function public.rpc_get_prescriptions(
  uuid,
  uuid,
  uuid,
  integer
) to authenticated;

grant execute on function public.rpc_upsert_prescription(
  uuid,
  uuid,
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  jsonb
) to authenticated;
