-- 2026-05-06
-- Adds inventory support + missing RPCs used by the app.
-- Safe to run multiple times (uses IF NOT EXISTS + CREATE OR REPLACE).

-- =========================
-- Inventory Tables
-- =========================

create table if not exists public.clinic_inventory_items (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null,
  name text not null,
  unit text null,
  qty integer not null default 0,
  threshold integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_inventory_items_clinic on public.clinic_inventory_items (clinic_id, created_at desc);
create index if not exists idx_inventory_items_clinic_name on public.clinic_inventory_items (clinic_id, lower(name));

-- =========================
-- Inventory RPCs
-- =========================

create or replace function public.rpc_get_inventory_items(
  p_requester_id uuid,
  p_search text default null,
  p_page integer default 1,
  p_items_per_page integer default 200
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
  from public.clinic_inventory_items i
  where i.clinic_id = v_clinic_id
    and i.active = true
    and (
      p_search is null
      or i.name ilike '%' || p_search || '%'
    );

  select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
  into v_rows
  from (
    select
      i.id,
      i.name,
      i.unit,
      i.qty,
      i.threshold,
      i.active,
      i.updated_at,
      i.created_at
    from public.clinic_inventory_items i
    where i.clinic_id = v_clinic_id
      and i.active = true
      and (
        p_search is null
        or i.name ilike '%' || p_search || '%'
      )
    order by i.updated_at desc
    limit p_items_per_page
    offset v_offset
  ) t;

  return jsonb_build_object(
    'items', v_rows,
    'total', v_total,
    'page', p_page,
    'itemsPerPage', p_items_per_page
  );
end;
$function$;

create or replace function public.rpc_upsert_inventory_item(
  p_requester_id uuid,
  p_item_id uuid default null,
  p_name text,
  p_unit text default null,
  p_qty integer default 0,
  p_threshold integer default 0,
  p_active boolean default true
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_clinic_id uuid;
  v_id uuid;
begin
  select clinic_id into v_clinic_id
  from public.users_metadata
  where id = p_requester_id and active = true
  limit 1;

  if v_clinic_id is null then
    raise exception 'Requester has no clinic';
  end if;

  if p_item_id is null then
    insert into public.clinic_inventory_items (
      clinic_id, name, unit, qty, threshold, active, created_at, updated_at
    ) values (
      v_clinic_id,
      trim(p_name),
      nullif(trim(p_unit), ''),
      coalesce(p_qty, 0),
      coalesce(p_threshold, 0),
      coalesce(p_active, true),
      now(),
      now()
    )
    returning id into v_id;
  else
    update public.clinic_inventory_items set
      name = trim(p_name),
      unit = nullif(trim(p_unit), ''),
      qty = coalesce(p_qty, qty),
      threshold = coalesce(p_threshold, threshold),
      active = coalesce(p_active, active),
      updated_at = now()
    where id = p_item_id
      and clinic_id = v_clinic_id
    returning id into v_id;
  end if;

  if v_id is null then
    raise exception 'Inventory item not found or not allowed';
  end if;

  return v_id;
end;
$function$;

-- =========================
-- Missing RPCs (Invoices)
-- =========================

create or replace function public.rpc_get_invoices(
  p_requester_id uuid,
  p_patient_id uuid default null,
  p_status text default null,
  p_page integer default 1,
  p_items_per_page integer default 50
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
  from public.clinic_invoices i
  where i.clinic_id = v_clinic_id
    and (p_patient_id is null or i.patient_id = p_patient_id)
    and (p_status is null or i.status = p_status);

  select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
  into v_rows
  from (
    select
      i.id,
      i.patient_id,
      i.appointment_id,
      i.status,
      i.subtotal,
      i.discount,
      i.total,
      i.paid_amount,
      i.issued_at,
      i.created_at,
      i.updated_at
    from public.clinic_invoices i
    where i.clinic_id = v_clinic_id
      and (p_patient_id is null or i.patient_id = p_patient_id)
      and (p_status is null or i.status = p_status)
    order by i.created_at desc
    limit p_items_per_page
    offset v_offset
  ) t;

  return jsonb_build_object(
    'invoices', v_rows,
    'total', v_total,
    'page', p_page,
    'itemsPerPage', p_items_per_page
  );
end;
$function$;

