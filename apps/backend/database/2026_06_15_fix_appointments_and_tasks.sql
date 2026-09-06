-- Fix enum/text comparison in rpc_get_appointments and add the missing task backend.

create or replace function public.rpc_get_appointments(
  p_requester_id uuid,
  p_search text default null::text,
  p_status text default null::text,
  p_doctor_id uuid default null::uuid,
  p_start_date timestamp with time zone default null::timestamp with time zone,
  p_end_date timestamp with time zone default null::timestamp with time zone,
  p_page integer default 1,
  p_items_per_page integer default 10
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

  v_offset := greatest((p_page - 1) * p_items_per_page, 0);

  select count(*)
  into v_total
  from public.appointments a
  left join public.patients p on p.id = a.patient_id
  left join public.users_metadata d on d.id = a.doctor_id
  where a.clinic_id = v_clinic_id
    and (p_status is null or a.status::text = p_status)
    and (p_doctor_id is null or a.doctor_id = p_doctor_id)
    and (p_start_date is null or a.scheduled_at >= p_start_date)
    and (p_end_date is null or a.scheduled_at <= p_end_date)
    and (
      p_search is null
      or p.first_name ilike '%' || p_search || '%'
      or p.last_name ilike '%' || p_search || '%'
      or p.phone ilike '%' || p_search || '%'
      or p.email ilike '%' || p_search || '%'
      or d.full_name ilike '%' || p_search || '%'
    );

  select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
  into v_rows
  from (
    select
      a.id,
      a.clinic_id,
      a.patient_id,
      a.doctor_id,
      a.scheduled_at,
      a.status,
      a.type,
      a.notes,
      a.created_at,
      a.updated_at,
      p.first_name as patient_first_name,
      p.last_name as patient_last_name,
      p.phone as patient_phone,
      p.email as patient_email,
      d.full_name as doctor_name
    from public.appointments a
    left join public.patients p on p.id = a.patient_id
    left join public.users_metadata d on d.id = a.doctor_id
    where a.clinic_id = v_clinic_id
      and (p_status is null or a.status::text = p_status)
      and (p_doctor_id is null or a.doctor_id = p_doctor_id)
      and (p_start_date is null or a.scheduled_at >= p_start_date)
      and (p_end_date is null or a.scheduled_at <= p_end_date)
      and (
        p_search is null
        or p.first_name ilike '%' || p_search || '%'
        or p.last_name ilike '%' || p_search || '%'
        or p.phone ilike '%' || p_search || '%'
        or p.email ilike '%' || p_search || '%'
        or d.full_name ilike '%' || p_search || '%'
      )
    order by a.scheduled_at desc
    limit p_items_per_page
    offset v_offset
  ) t;

  return jsonb_build_object(
    'appointments', v_rows,
    'total', v_total,
    'page', p_page,
    'itemsPerPage', p_items_per_page
  );
end;
$function$;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typnamespace = 'public'::regnamespace
      and typname = 'clinic_task_priority_enum'
  ) then
    create type public.clinic_task_priority_enum as enum ('high', 'medium', 'low');
  end if;

  if not exists (
    select 1
    from pg_type
    where typnamespace = 'public'::regnamespace
      and typname = 'clinic_task_status_enum'
  ) then
    create type public.clinic_task_status_enum as enum ('todo', 'in_progress', 'done');
  end if;
end
$$;

create table if not exists public.clinic_tasks (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null,
  title text not null,
  assignee_id uuid null,
  assignee_name text not null default 'Clinic team',
  priority public.clinic_task_priority_enum not null default 'medium',
  status public.clinic_task_status_enum not null default 'todo',
  due_text text null,
  due_at timestamp with time zone null,
  notes text null,
  created_by uuid null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index if not exists clinic_tasks_clinic_id_idx
  on public.clinic_tasks (clinic_id);

create index if not exists clinic_tasks_clinic_status_idx
  on public.clinic_tasks (clinic_id, status, updated_at desc);

create or replace function public.rpc_get_tasks(p_requester_id uuid)
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

  select coalesce(jsonb_agg(to_jsonb(t) order by t.updated_at desc), '[]'::jsonb)
  into v_rows
  from (
    select
      id,
      clinic_id,
      title,
      assignee_id,
      assignee_name,
      priority::text as priority,
      status::text as status,
      due_text,
      due_at,
      notes,
      created_by,
      created_at,
      updated_at
    from public.clinic_tasks
    where clinic_id = v_clinic_id
  ) t;

  return v_rows;
end;
$function$;

create or replace function public.rpc_create_task(
  p_requester_id uuid,
  p_title text,
  p_assignee_id uuid default null::uuid,
  p_assignee_name text default null::text,
  p_priority text default 'medium',
  p_due_text text default null::text,
  p_due_at timestamp with time zone default null::timestamp with time zone,
  p_notes text default null::text
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_clinic_id uuid;
  v_row public.clinic_tasks%rowtype;
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

  insert into public.clinic_tasks (
    clinic_id,
    title,
    assignee_id,
    assignee_name,
    priority,
    status,
    due_text,
    due_at,
    notes,
    created_by
  )
  values (
    v_clinic_id,
    coalesce(nullif(btrim(p_title), ''), 'Untitled task'),
    p_assignee_id,
    coalesce(nullif(btrim(p_assignee_name), ''), 'Clinic team'),
    coalesce(nullif(btrim(p_priority), ''), 'medium')::public.clinic_task_priority_enum,
    'todo'::public.clinic_task_status_enum,
    nullif(btrim(p_due_text), ''),
    p_due_at,
    nullif(btrim(p_notes), ''),
    p_requester_id
  )
  returning * into v_row;

  return jsonb_build_object(
    'id', v_row.id,
    'clinic_id', v_row.clinic_id,
    'title', v_row.title,
    'assignee_id', v_row.assignee_id,
    'assignee_name', v_row.assignee_name,
    'priority', v_row.priority::text,
    'status', v_row.status::text,
    'due_text', v_row.due_text,
    'due_at', v_row.due_at,
    'notes', v_row.notes,
    'created_by', v_row.created_by,
    'created_at', v_row.created_at,
    'updated_at', v_row.updated_at
  );
end;
$function$;

create or replace function public.rpc_update_task(
  p_requester_id uuid,
  p_task_id uuid,
  p_title text default null::text,
  p_assignee_id uuid default null::uuid,
  p_assignee_name text default null::text,
  p_priority text default null::text,
  p_status text default null::text,
  p_due_text text default null::text,
  p_due_at timestamp with time zone default null::timestamp with time zone,
  p_notes text default null::text
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_clinic_id uuid;
  v_row public.clinic_tasks%rowtype;
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

  update public.clinic_tasks
  set
    title = coalesce(nullif(btrim(p_title), ''), title),
    assignee_id = coalesce(p_assignee_id, assignee_id),
    assignee_name = coalesce(nullif(btrim(p_assignee_name), ''), assignee_name),
    priority = case
      when p_priority is null or btrim(p_priority) = '' then priority
      else p_priority::public.clinic_task_priority_enum
    end,
    status = case
      when p_status is null or btrim(p_status) = '' then status
      else p_status::public.clinic_task_status_enum
    end,
    due_text = case
      when p_due_text is null then due_text
      else nullif(btrim(p_due_text), '')
    end,
    due_at = coalesce(p_due_at, due_at),
    notes = case
      when p_notes is null then notes
      else nullif(btrim(p_notes), '')
    end,
    updated_at = now()
  where id = p_task_id
    and clinic_id = v_clinic_id
  returning * into v_row;

  if v_row.id is null then
    raise exception 'Task not found or access denied';
  end if;

  return jsonb_build_object(
    'id', v_row.id,
    'clinic_id', v_row.clinic_id,
    'title', v_row.title,
    'assignee_id', v_row.assignee_id,
    'assignee_name', v_row.assignee_name,
    'priority', v_row.priority::text,
    'status', v_row.status::text,
    'due_text', v_row.due_text,
    'due_at', v_row.due_at,
    'notes', v_row.notes,
    'created_by', v_row.created_by,
    'created_at', v_row.created_at,
    'updated_at', v_row.updated_at
  );
end;
$function$;

grant execute on function public.rpc_get_appointments(
  uuid,
  text,
  text,
  uuid,
  timestamp with time zone,
  timestamp with time zone,
  integer,
  integer
) to authenticated;

grant execute on function public.rpc_get_tasks(uuid) to authenticated;
grant execute on function public.rpc_create_task(
  uuid,
  text,
  uuid,
  text,
  text,
  text,
  timestamp with time zone,
  text
) to authenticated;
grant execute on function public.rpc_update_task(
  uuid,
  uuid,
  text,
  uuid,
  text,
  text,
  text,
  text,
  timestamp with time zone,
  text
) to authenticated;
