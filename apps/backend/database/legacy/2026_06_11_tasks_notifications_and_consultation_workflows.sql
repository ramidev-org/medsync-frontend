-- Tasks, notifications, consultation documents, and prescriptions
-- Run in Supabase SQL editor (public schema).

begin;

/* =========================================================
   1) Shared clinic tasks
   ========================================================= */

create table if not exists public.clinic_tasks (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  title text not null,
  assignee_id uuid references public.users_metadata(id) on delete set null,
  assignee_name text,
  priority text not null default 'medium' check (priority in ('high', 'medium', 'low')),
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  due_text text,
  due_at timestamptz,
  notes text,
  created_by uuid references public.users_metadata(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_clinic_tasks_clinic_status_updated
  on public.clinic_tasks (clinic_id, status, updated_at desc);

create index if not exists idx_clinic_tasks_clinic_due
  on public.clinic_tasks (clinic_id, due_at asc nulls last);

drop trigger if exists trg_clinic_tasks_updated on public.clinic_tasks;
create trigger trg_clinic_tasks_updated
before update on public.clinic_tasks
for each row execute function public.update_updated_at();

create or replace function public.rpc_get_tasks(
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
  select clinic_id into v_clinic_id
  from public.users_metadata
  where id = p_requester_id and active = true
  limit 1;

  if v_clinic_id is null then
    raise exception 'Requester has no clinic';
  end if;

  select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
  into v_rows
  from (
    select
      t.id,
      t.clinic_id,
      t.title,
      t.assignee_id,
      coalesce(nullif(btrim(t.assignee_name), ''), um.full_name, 'Clinic team') as assignee_name,
      t.priority,
      t.status,
      t.due_text,
      t.due_at,
      t.notes,
      t.created_by,
      t.created_at,
      t.updated_at
    from public.clinic_tasks t
    left join public.users_metadata um on um.id = t.assignee_id
    where t.clinic_id = v_clinic_id
    order by
      case t.status
        when 'todo' then 0
        when 'in_progress' then 1
        else 2
      end,
      t.due_at asc nulls last,
      t.updated_at desc
  ) t;

  return v_rows;
end;
$$;

create or replace function public.rpc_create_task(
  p_requester_id uuid,
  p_title text,
  p_assignee_id uuid default null,
  p_assignee_name text default null,
  p_priority text default 'medium',
  p_due_text text default null,
  p_due_at timestamptz default null,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_clinic_id uuid;
  v_assignee_clinic uuid;
  v_row jsonb;
begin
  select clinic_id into v_clinic_id
  from public.users_metadata
  where id = p_requester_id and active = true
  limit 1;

  if v_clinic_id is null then
    raise exception 'Requester has no clinic';
  end if;

  if p_assignee_id is not null then
    select clinic_id into v_assignee_clinic
    from public.users_metadata
    where id = p_assignee_id and active = true
    limit 1;

    if v_assignee_clinic is null or v_assignee_clinic <> v_clinic_id then
      raise exception 'Assignee not found in clinic';
    end if;
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
    created_by,
    created_at,
    updated_at
  )
  values (
    v_clinic_id,
    btrim(p_title),
    p_assignee_id,
    nullif(btrim(p_assignee_name), ''),
    case
      when p_priority in ('high', 'medium', 'low') then p_priority
      else 'medium'
    end,
    'todo',
    nullif(btrim(p_due_text), ''),
    p_due_at,
    nullif(btrim(p_notes), ''),
    p_requester_id,
    now(),
    now()
  );

  select to_jsonb(t)
  into v_row
  from (
    select
      task.id,
      task.clinic_id,
      task.title,
      task.assignee_id,
      coalesce(nullif(btrim(task.assignee_name), ''), um.full_name, 'Clinic team') as assignee_name,
      task.priority,
      task.status,
      task.due_text,
      task.due_at,
      task.notes,
      task.created_by,
      task.created_at,
      task.updated_at
    from public.clinic_tasks task
    left join public.users_metadata um on um.id = task.assignee_id
    where task.created_by = p_requester_id
    order by task.created_at desc
    limit 1
  ) t;

  return v_row;
end;
$$;

create or replace function public.rpc_update_task(
  p_requester_id uuid,
  p_task_id uuid,
  p_title text default null,
  p_assignee_id uuid default null,
  p_assignee_name text default null,
  p_priority text default null,
  p_status text default null,
  p_due_text text default null,
  p_due_at timestamptz default null,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_clinic_id uuid;
  v_assignee_clinic uuid;
  v_row jsonb;
begin
  select clinic_id into v_clinic_id
  from public.users_metadata
  where id = p_requester_id and active = true
  limit 1;

  if v_clinic_id is null then
    raise exception 'Requester has no clinic';
  end if;

  if not exists (
    select 1
    from public.clinic_tasks t
    where t.id = p_task_id
      and t.clinic_id = v_clinic_id
  ) then
    raise exception 'Task not found or access denied';
  end if;

  if p_assignee_id is not null then
    select clinic_id into v_assignee_clinic
    from public.users_metadata
    where id = p_assignee_id and active = true
    limit 1;

    if v_assignee_clinic is null or v_assignee_clinic <> v_clinic_id then
      raise exception 'Assignee not found in clinic';
    end if;
  end if;

  update public.clinic_tasks
  set
    title = coalesce(nullif(btrim(p_title), ''), title),
    assignee_id = coalesce(p_assignee_id, assignee_id),
    assignee_name = case
      when p_assignee_id is not null then assignee_name
      when p_assignee_name is not null then nullif(btrim(p_assignee_name), '')
      else assignee_name
    end,
    priority = case
      when p_priority in ('high', 'medium', 'low') then p_priority
      else priority
    end,
    status = case
      when p_status in ('todo', 'in_progress', 'done') then p_status
      else status
    end,
    due_text = case
      when p_due_text is not null then nullif(btrim(p_due_text), '')
      else due_text
    end,
    due_at = coalesce(p_due_at, due_at),
    notes = case
      when p_notes is not null then nullif(btrim(p_notes), '')
      else notes
    end,
    updated_at = now()
  where id = p_task_id
    and clinic_id = v_clinic_id;

  select to_jsonb(t)
  into v_row
  from (
    select
      task.id,
      task.clinic_id,
      task.title,
      task.assignee_id,
      coalesce(nullif(btrim(task.assignee_name), ''), um.full_name, 'Clinic team') as assignee_name,
      task.priority,
      task.status,
      task.due_text,
      task.due_at,
      task.notes,
      task.created_by,
      task.created_at,
      task.updated_at
    from public.clinic_tasks task
    left join public.users_metadata um on um.id = task.assignee_id
    where task.id = p_task_id
  ) t;

  return v_row;
end;
$$;

/* =========================================================
   2) Notification read state
   ========================================================= */

create table if not exists public.clinic_notification_reads (
  user_id uuid not null references public.users_metadata(id) on delete cascade,
  notification_key text not null,
  read_at timestamptz not null default now(),
  primary key (user_id, notification_key)
);

create index if not exists idx_notification_reads_user_read
  on public.clinic_notification_reads (user_id, read_at desc);

create or replace function public.rpc_get_notifications(
  p_requester_id uuid,
  p_limit integer default 30
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
  select clinic_id into v_clinic_id
  from public.users_metadata
  where id = p_requester_id and active = true
  limit 1;

  if v_clinic_id is null then
    raise exception 'Requester has no clinic';
  end if;

  with raw_notifications as (
    select
      'task:' || t.id::text as notification_key,
      'task'::text as kind,
      'Task still open'::text as title,
      coalesce(t.title, 'Task pending') || coalesce(' • ' || nullif(btrim(t.assignee_name), ''), '') as description,
      t.updated_at as created_at
    from public.clinic_tasks t
    where t.clinic_id = v_clinic_id
      and t.status <> 'done'

    union all

    select
      'invite:' || i.id::text as notification_key,
      'system'::text as kind,
      'Pending staff invite'::text as title,
      coalesce(i.email, 'Unknown email') || ' • ' || coalesce(i.user_type::text, 'assistant') as description,
      coalesce(i.created_at, now()) as created_at
    from public.staff_invites i
    where i.clinic_id = v_clinic_id
      and i.accepted_at is null
      and (i.expires_at is null or i.expires_at > now())

    union all

    select
      'inventory:' || inv.id::text as notification_key,
      'system'::text as kind,
      'Inventory threshold reached'::text as title,
      inv.name || ' • ' || coalesce(inv.qty_on_hand::text, '0') || ' left' as description,
      inv.updated_at as created_at
    from public.clinic_inventory_items inv
    where inv.clinic_id = v_clinic_id
      and inv.qty_on_hand <= inv.reorder_threshold

    union all

    select
      'appointment:' || a.id::text as notification_key,
      'follow_up'::text as kind,
      'Upcoming appointment needs attention'::text as title,
      trim(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, '')) || ' • ' ||
        to_char(a.scheduled_at, 'DD Mon HH24:MI') as description,
      a.scheduled_at as created_at
    from public.appointments a
    left join public.patients p on p.id = a.patient_id
    where a.clinic_id = v_clinic_id
      and a.status in ('pending', 'confirmed', 'in_consultation')
      and a.scheduled_at >= now() - interval '2 days'
  )
  select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
  into v_rows
  from (
    select
      rn.notification_key as id,
      rn.notification_key,
      rn.kind,
      rn.title,
      rn.description,
      rn.created_at,
      not exists (
        select 1
        from public.clinic_notification_reads nr
        where nr.user_id = p_requester_id
          and nr.notification_key = rn.notification_key
      ) as unread
    from raw_notifications rn
    order by rn.created_at desc
    limit greatest(coalesce(p_limit, 30), 1)
  ) t;

  return v_rows;
end;
$$;

create or replace function public.rpc_mark_notifications_read(
  p_requester_id uuid,
  p_notification_keys text[] default null
)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_clinic_id uuid;
begin
  select clinic_id into v_clinic_id
  from public.users_metadata
  where id = p_requester_id and active = true
  limit 1;

  if v_clinic_id is null then
    raise exception 'Requester has no clinic';
  end if;

  insert into public.clinic_notification_reads (user_id, notification_key, read_at)
  select
    p_requester_id,
    key_item,
    now()
  from unnest(coalesce(p_notification_keys, array[]::text[])) as key_item
  on conflict (user_id, notification_key) do update
  set read_at = excluded.read_at;

  return true;
end;
$$;

/* =========================================================
   3) Consultation documents helpers
   ========================================================= */

create or replace function public.rpc_get_consultation_documents(
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
  v_rows jsonb;
begin
  select clinic_id into v_clinic_id
  from public.users_metadata
  where id = p_requester_id and active = true
  limit 1;

  if v_clinic_id is null then
    raise exception 'Requester has no clinic';
  end if;

  if not exists (
    select 1
    from public.consultations c
    where c.id = p_consultation_id
      and c.clinic_id = v_clinic_id
  ) then
    raise exception 'Consultation not found or access denied';
  end if;

  select coalesce(jsonb_agg(to_jsonb(doc) order by doc.created_at desc), '[]'::jsonb)
  into v_rows
  from (
    select
      d.id,
      d.clinic_id,
      d.consultation_id,
      d.patient_id,
      d.uploader_id,
      d.kind,
      d.name,
      d.mime_type,
      d.url,
      d.size_bytes,
      d.sha256,
      d.study_instance_uid,
      d.series_instance_uid,
      d.sop_instance_uid,
      d.accession_number,
      d.metadata,
      d.created_at,
      d.updated_at,
      d.treatment_case_id,
      d.document_type,
      d.title,
      d.notes
    from public.consultation_documents d
    where d.consultation_id = p_consultation_id
  ) doc;

  return v_rows;
end;
$$;

create or replace function public.rpc_create_consultation_document(
  p_requester_id uuid,
  p_consultation_id uuid,
  p_patient_id uuid,
  p_name text,
  p_kind text default 'PDF',
  p_document_type text default null,
  p_title text default null,
  p_notes text default null,
  p_mime_type text default null,
  p_url text default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_clinic_id uuid;
  v_row jsonb;
begin
  select clinic_id into v_clinic_id
  from public.users_metadata
  where id = p_requester_id and active = true
  limit 1;

  if v_clinic_id is null then
    raise exception 'Requester has no clinic';
  end if;

  if not exists (
    select 1
    from public.consultations c
    where c.id = p_consultation_id
      and c.clinic_id = v_clinic_id
      and c.patient_id = p_patient_id
  ) then
    raise exception 'Consultation not found or access denied';
  end if;

  insert into public.consultation_documents (
    clinic_id,
    consultation_id,
    patient_id,
    uploader_id,
    kind,
    name,
    mime_type,
    url,
    document_type,
    title,
    notes,
    created_at,
    updated_at
  )
  values (
    v_clinic_id,
    p_consultation_id,
    p_patient_id,
    p_requester_id,
    coalesce(nullif(btrim(p_kind), ''), 'PDF'),
    btrim(p_name),
    nullif(btrim(p_mime_type), ''),
    nullif(btrim(p_url), ''),
    nullif(btrim(p_document_type), ''),
    nullif(btrim(p_title), ''),
    nullif(btrim(p_notes), ''),
    now(),
    now()
  );

  select to_jsonb(d)
  into v_row
  from public.consultation_documents d
  where d.consultation_id = p_consultation_id
  order by d.created_at desc
  limit 1;

  return v_row;
end;
$$;

create or replace function public.rpc_delete_consultation_document(
  p_requester_id uuid,
  p_document_id uuid
)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_clinic_id uuid;
begin
  select clinic_id into v_clinic_id
  from public.users_metadata
  where id = p_requester_id and active = true
  limit 1;

  if v_clinic_id is null then
    raise exception 'Requester has no clinic';
  end if;

  delete from public.consultation_documents d
  where d.id = p_document_id
    and d.clinic_id = v_clinic_id;

  return true;
end;
$$;

/* =========================================================
   4) Prescriptions helpers
   ========================================================= */

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
as $$
declare
  v_clinic_id uuid;
  v_rows jsonb;
begin
  select clinic_id into v_clinic_id
  from public.users_metadata
  where id = p_requester_id and active = true
  limit 1;

  if v_clinic_id is null then
    raise exception 'Requester has no clinic';
  end if;

  select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
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
        select coalesce(
          jsonb_agg(
            jsonb_build_object(
              'id', pm.id,
              'medicine_name', pm.medicine_name,
              'dose', pm.dose,
              'frequency', pm.frequency,
              'duration', pm.duration,
              'instructions', pm.instructions,
              'created_at', pm.created_at
            )
            order by pm.created_at asc
          ),
          '[]'::jsonb
        )
        from public.prescription_medications pm
        where pm.prescription_id = p.id
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
$$;

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
as $$
declare
  v_clinic_id uuid;
  v_row jsonb;
  v_prescription_id uuid;
begin
  select clinic_id into v_clinic_id
  from public.users_metadata
  where id = p_requester_id and active = true
  limit 1;

  if v_clinic_id is null then
    raise exception 'Requester has no clinic';
  end if;

  if not exists (
    select 1
    from public.consultations c
    where c.id = p_consultation_id
      and c.clinic_id = v_clinic_id
      and c.patient_id = p_patient_id
  ) then
    raise exception 'Consultation not found or access denied';
  end if;

  if p_prescription_id is null then
    insert into public.prescriptions (
      consultation_id,
      patient_id,
      doctor_id,
      template_name,
      signed_by,
      created_at,
      updated_at,
      status,
      notes,
      signed_at
    )
    values (
      p_consultation_id,
      p_patient_id,
      p_requester_id,
      nullif(btrim(p_template_name), ''),
      nullif(btrim(p_signed_by), ''),
      now(),
      now(),
      case
        when p_status in ('draft', 'signed', 'cancelled') then p_status
        else 'draft'
      end,
      nullif(btrim(p_notes), ''),
      case when p_status = 'signed' then now() else null end
    )
    returning id into v_prescription_id;
  else
    if not exists (
      select 1
      from public.prescriptions p
      join public.consultations c on c.id = p.consultation_id
      where p.id = p_prescription_id
        and c.clinic_id = v_clinic_id
    ) then
      raise exception 'Prescription not found or access denied';
    end if;

    update public.prescriptions
    set
      template_name = coalesce(nullif(btrim(p_template_name), ''), template_name),
      signed_by = coalesce(nullif(btrim(p_signed_by), ''), signed_by),
      status = case
        when p_status in ('draft', 'signed', 'cancelled') then p_status
        else status
      end,
      notes = case
        when p_notes is not null then nullif(btrim(p_notes), '')
        else notes
      end,
      signed_at = case
        when p_status = 'signed' then coalesce(signed_at, now())
        else signed_at
      end,
      updated_at = now()
    where id = p_prescription_id;

    v_prescription_id := p_prescription_id;
  end if;

  delete from public.prescription_medications
  where prescription_id = v_prescription_id;

  insert into public.prescription_medications (
    prescription_id,
    medicine_name,
    dose,
    frequency,
    duration,
    instructions,
    created_at
  )
  select
    v_prescription_id,
    coalesce(nullif(btrim(x->>'medicine_name'), ''), nullif(btrim(x->>'name'), '')),
    nullif(btrim(x->>'dose'), ''),
    nullif(btrim(x->>'frequency'), ''),
    nullif(btrim(x->>'duration'), ''),
    nullif(btrim(x->>'instructions'), ''),
    now()
  from jsonb_array_elements(coalesce(p_medications, '[]'::jsonb)) as x
  where coalesce(nullif(btrim(x->>'medicine_name'), ''), nullif(btrim(x->>'name'), '')) is not null;

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
        select coalesce(
          jsonb_agg(
            jsonb_build_object(
              'id', pm.id,
              'medicine_name', pm.medicine_name,
              'dose', pm.dose,
              'frequency', pm.frequency,
              'duration', pm.duration,
              'instructions', pm.instructions,
              'created_at', pm.created_at
            )
            order by pm.created_at asc
          ),
          '[]'::jsonb
        )
        from public.prescription_medications pm
        where pm.prescription_id = p.id
      ) as medications
    from public.prescriptions p
    where p.id = v_prescription_id
  ) t;

  return v_row;
end;
$$;

commit;
