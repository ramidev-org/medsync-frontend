-- Real backend for the "Analyses medicales" workspace screen.
-- Apply this in Supabase SQL editor, then refresh the app.

create table if not exists public.lab_orders (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  consultation_id uuid null references public.consultations(id) on delete set null,
  patient_id uuid not null references public.patients(id) on delete cascade,
  doctor_id uuid null references public.users_metadata(id) on delete set null,
  source_type text not null default 'internal',
  priority public.lab_priority_enum not null default 'routine',
  status public.lab_order_status_enum not null default 'ordered',
  payment_status public.payment_status_enum not null default 'pending',
  requested_tests text[] not null default '{}'::text[],
  clinical_context text null,
  lab_comments text null,
  payment_note text null,
  estimated_total numeric(12,2) null,
  result_items jsonb not null default '[]'::jsonb,
  result_summary text null,
  doctor_note text null,
  external_lab_name text null,
  requested_at timestamp with time zone not null default now(),
  sampled_at timestamp with time zone null,
  resulted_at timestamp with time zone null,
  validated_at timestamp with time zone null,
  created_by uuid null references public.users_metadata(id) on delete set null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint lab_orders_source_type_check check (source_type in ('internal', 'external')),
  constraint lab_orders_result_items_array_check check (jsonb_typeof(result_items) = 'array')
);

create index if not exists lab_orders_clinic_requested_at_idx
  on public.lab_orders (clinic_id, requested_at desc);

create index if not exists lab_orders_patient_idx
  on public.lab_orders (patient_id, requested_at desc);

create index if not exists lab_orders_consultation_idx
  on public.lab_orders (consultation_id);

create or replace function public.rpc_get_lab_orders(
  p_requester_id uuid,
  p_search text default null,
  p_status text default null,
  p_source_type text default null,
  p_limit integer default 100
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

  select coalesce(jsonb_agg(to_jsonb(t) order by t.requested_at desc), '[]'::jsonb)
  into v_rows
  from (
    select
      lo.id,
      lo.clinic_id,
      lo.consultation_id,
      lo.patient_id,
      lo.doctor_id,
      lo.source_type,
      lo.priority,
      lo.status,
      lo.payment_status,
      lo.requested_tests,
      lo.clinical_context,
      lo.lab_comments,
      lo.payment_note,
      lo.estimated_total,
      lo.result_items,
      lo.result_summary,
      lo.doctor_note,
      lo.external_lab_name,
      lo.requested_at,
      lo.sampled_at,
      lo.resulted_at,
      lo.validated_at,
      lo.created_by,
      lo.created_at,
      lo.updated_at,
      p.first_name as patient_first_name,
      p.last_name as patient_last_name,
      extract(year from age(current_date, p.date_of_birth))::int as patient_age,
      um.full_name as doctor_name
    from public.lab_orders lo
    join public.patients p on p.id = lo.patient_id
    left join public.users_metadata um on um.id = lo.doctor_id
    where lo.clinic_id = v_clinic_id
      and (
        p_status is null
        or btrim(p_status) = ''
        or lo.status::text = lower(btrim(p_status))
      )
      and (
        p_source_type is null
        or btrim(p_source_type) = ''
        or lo.source_type = lower(btrim(p_source_type))
      )
      and (
        p_search is null
        or btrim(p_search) = ''
        or concat_ws(' ', p.first_name, p.last_name, um.full_name, array_to_string(lo.requested_tests, ' '), lo.clinical_context, lo.lab_comments)
           ilike '%' || btrim(p_search) || '%'
      )
    order by lo.requested_at desc
    limit greatest(coalesce(p_limit, 100), 1)
  ) t;

  return v_rows;
end;
$function$;

create or replace function public.rpc_get_lab_order(
  p_requester_id uuid,
  p_lab_order_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_clinic_id uuid;
  v_row jsonb;
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

  select to_jsonb(t)
  into v_row
  from (
    select
      lo.id,
      lo.clinic_id,
      lo.consultation_id,
      lo.patient_id,
      lo.doctor_id,
      lo.source_type,
      lo.priority,
      lo.status,
      lo.payment_status,
      lo.requested_tests,
      lo.clinical_context,
      lo.lab_comments,
      lo.payment_note,
      lo.estimated_total,
      lo.result_items,
      lo.result_summary,
      lo.doctor_note,
      lo.external_lab_name,
      lo.requested_at,
      lo.sampled_at,
      lo.resulted_at,
      lo.validated_at,
      lo.created_by,
      lo.created_at,
      lo.updated_at,
      p.first_name as patient_first_name,
      p.last_name as patient_last_name,
      extract(year from age(current_date, p.date_of_birth))::int as patient_age,
      um.full_name as doctor_name
    from public.lab_orders lo
    join public.patients p on p.id = lo.patient_id
    left join public.users_metadata um on um.id = lo.doctor_id
    where lo.id = p_lab_order_id
      and lo.clinic_id = v_clinic_id
    limit 1
  ) t;

  if v_row is null then
    raise exception 'Lab order not found or access denied';
  end if;

  return v_row;
end;
$function$;

create or replace function public.rpc_create_lab_order(
  p_requester_id uuid,
  p_patient_id uuid,
  p_consultation_id uuid default null,
  p_source_type text default 'internal',
  p_priority text default 'routine',
  p_requested_tests text[] default null,
  p_clinical_context text default null,
  p_lab_comments text default null,
  p_payment_status text default 'pending',
  p_payment_note text default null,
  p_external_lab_name text default null,
  p_estimated_total numeric default null
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_clinic_id uuid;
  v_requester_type public.user_type_enum;
  v_consultation record;
  v_doctor_id uuid;
  v_lab_order_id uuid;
  v_requested_tests text[];
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

  if not exists (
    select 1
    from public.patients
    where id = p_patient_id
      and clinic_id = v_clinic_id
  ) then
    raise exception 'Patient not found or access denied';
  end if;

  if p_consultation_id is not null then
    select id, doctor_id, patient_id
    into v_consultation
    from public.consultations
    where id = p_consultation_id
      and clinic_id = v_clinic_id
    limit 1;

    if v_consultation.id is null then
      raise exception 'Consultation not found or access denied';
    end if;

    if v_consultation.patient_id <> p_patient_id then
      raise exception 'Consultation patient does not match lab order patient';
    end if;
  end if;

  v_doctor_id := case
    when v_requester_type = 'doctor'::public.user_type_enum then p_requester_id
    when p_consultation_id is not null then v_consultation.doctor_id
    else null
  end;

  v_requested_tests := coalesce(p_requested_tests, '{}'::text[]);

  insert into public.lab_orders (
    clinic_id,
    consultation_id,
    patient_id,
    doctor_id,
    source_type,
    priority,
    status,
    payment_status,
    requested_tests,
    clinical_context,
    lab_comments,
    payment_note,
    estimated_total,
    external_lab_name,
    created_by,
    requested_at,
    created_at,
    updated_at
  )
  values (
    v_clinic_id,
    p_consultation_id,
    p_patient_id,
    v_doctor_id,
    lower(coalesce(nullif(btrim(p_source_type), ''), 'internal')),
    coalesce(nullif(btrim(p_priority), ''), 'routine')::public.lab_priority_enum,
    'ordered'::public.lab_order_status_enum,
    coalesce(nullif(btrim(p_payment_status), ''), 'pending')::public.payment_status_enum,
    v_requested_tests,
    nullif(btrim(p_clinical_context), ''),
    nullif(btrim(p_lab_comments), ''),
    nullif(btrim(p_payment_note), ''),
    coalesce(
      p_estimated_total,
      greatest(coalesce(array_length(v_requested_tests, 1), 0), 0)::numeric * 800
    ),
    nullif(btrim(p_external_lab_name), ''),
    p_requester_id,
    now(),
    now(),
    now()
  )
  returning id into v_lab_order_id;

  if p_consultation_id is not null then
    insert into public.consultation_events (
      clinic_id,
      consultation_id,
      actor_id,
      event_type,
      payload
    )
    values (
      v_clinic_id,
      p_consultation_id,
      p_requester_id,
      'lab_order_created',
      jsonb_build_object(
        'lab_order_id', v_lab_order_id,
        'requested_tests', v_requested_tests,
        'payment_status', coalesce(nullif(btrim(p_payment_status), ''), 'pending')
      )
    );
  end if;

  return v_lab_order_id;
end;
$function$;

create or replace function public.rpc_save_lab_results(
  p_requester_id uuid,
  p_lab_order_id uuid,
  p_status text,
  p_result_items jsonb default '[]'::jsonb,
  p_result_summary text default null,
  p_doctor_note text default null
)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_clinic_id uuid;
  v_order record;
  v_status public.lab_order_status_enum;
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
  into v_order
  from public.lab_orders
  where id = p_lab_order_id
    and clinic_id = v_clinic_id
  limit 1;

  if v_order.id is null then
    raise exception 'Lab order not found or access denied';
  end if;

  v_status := coalesce(nullif(btrim(p_status), ''), 'partial')::public.lab_order_status_enum;

  update public.lab_orders
  set
    status = v_status,
    result_items = coalesce(p_result_items, '[]'::jsonb),
    result_summary = nullif(btrim(p_result_summary), ''),
    doctor_note = nullif(btrim(p_doctor_note), ''),
    sampled_at = case
      when v_status in ('collected'::public.lab_order_status_enum, 'partial'::public.lab_order_status_enum, 'completed'::public.lab_order_status_enum)
      then coalesce(sampled_at, now())
      else sampled_at
    end,
    resulted_at = case
      when v_status in ('partial'::public.lab_order_status_enum, 'completed'::public.lab_order_status_enum)
      then now()
      else resulted_at
    end,
    validated_at = case
      when v_status = 'completed'::public.lab_order_status_enum
      then now()
      else validated_at
    end,
    updated_at = now()
  where id = p_lab_order_id
    and clinic_id = v_clinic_id;

  if v_order.consultation_id is not null then
    insert into public.consultation_events (
      clinic_id,
      consultation_id,
      actor_id,
      event_type,
      payload
    )
    values (
      v_clinic_id,
      v_order.consultation_id,
      p_requester_id,
      'lab_results_saved',
      jsonb_build_object(
        'lab_order_id', p_lab_order_id,
        'status', v_status::text
      )
    );
  end if;

  return true;
end;
$function$;

grant execute on function public.rpc_get_lab_orders(uuid, text, text, text, integer) to authenticated;
grant execute on function public.rpc_get_lab_order(uuid, uuid) to authenticated;
grant execute on function public.rpc_create_lab_order(uuid, uuid, uuid, text, text, text[], text, text, text, text, text, numeric) to authenticated;
grant execute on function public.rpc_save_lab_results(uuid, uuid, text, jsonb, text, text) to authenticated;
