-- Yolo-inspired web modules (Phase 1)
-- Run in Supabase SQL editor (public schema).
-- Safe to re-run (uses IF NOT EXISTS / CREATE OR REPLACE).

begin;

-- 1) Services catalog (clinic-scoped)
create table if not exists public.clinic_services (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null,
  code text null,
  name text not null,
  category text null,
  color text null,
  duration_minutes integer null,
  price numeric null,
  cost numeric null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_clinic_services_clinic on public.clinic_services (clinic_id);
create index if not exists idx_clinic_services_active on public.clinic_services (clinic_id, active);
create index if not exists idx_clinic_services_name on public.clinic_services (clinic_id, name);

drop trigger if exists trg_clinic_services_updated on public.clinic_services;
create trigger trg_clinic_services_updated
before update on public.clinic_services
for each row execute function public.update_updated_at();

-- 2) Invoices (basic) + expenses (basic) - optional, used by future UI pages
create table if not exists public.clinic_invoices (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null,
  patient_id uuid not null,
  appointment_id uuid null,
  status text not null default 'draft',
  subtotal numeric not null default 0,
  discount numeric not null default 0,
  total numeric not null default 0,
  paid_amount numeric not null default 0,
  issued_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_clinic_invoices_clinic on public.clinic_invoices (clinic_id, created_at desc);
create index if not exists idx_clinic_invoices_patient on public.clinic_invoices (clinic_id, patient_id, created_at desc);

drop trigger if exists trg_clinic_invoices_updated on public.clinic_invoices;
create trigger trg_clinic_invoices_updated
before update on public.clinic_invoices
for each row execute function public.update_updated_at();

create table if not exists public.clinic_invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.clinic_invoices(id) on delete cascade,
  service_id uuid null references public.clinic_services(id) on delete set null,
  description text not null,
  qty numeric not null default 1,
  unit_price numeric not null default 0,
  line_total numeric not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_clinic_invoice_items_invoice on public.clinic_invoice_items (invoice_id);

create table if not exists public.clinic_expenses (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null,
  category text null,
  amount numeric not null,
  notes text null,
  spent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_clinic_expenses_clinic on public.clinic_expenses (clinic_id, spent_at desc);

-- -----------------------------
-- RPCs (SECURITY DEFINER) for tenancy-safe access
-- -----------------------------

create or replace function public.rpc_get_services(
  p_requester_id uuid,
  p_search text default null,
  p_page integer default 1,
  p_items_per_page integer default 50
) returns jsonb
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
  select clinic_id into v_clinic_id
  from public.users_metadata
  where id = p_requester_id and active = true
  limit 1;

  if v_clinic_id is null then
    raise exception 'Requester has no clinic';
  end if;

  v_offset := greatest((p_page - 1) * p_items_per_page, 0);

  select count(*) into v_total
  from public.clinic_services s
  where s.clinic_id = v_clinic_id
    and (
      p_search is null
      or s.name ilike '%' || p_search || '%'
      or s.code ilike '%' || p_search || '%'
      or s.category ilike '%' || p_search || '%'
    );

  select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
  into v_rows
  from (
    select
      s.id,
      s.clinic_id,
      s.code,
      s.name,
      s.category,
      s.color,
      s.duration_minutes,
      s.price,
      s.cost,
      s.active,
      s.created_at,
      s.updated_at
    from public.clinic_services s
    where s.clinic_id = v_clinic_id
      and (
        p_search is null
        or s.name ilike '%' || p_search || '%'
        or s.code ilike '%' || p_search || '%'
        or s.category ilike '%' || p_search || '%'
      )
    order by s.created_at desc
    limit p_items_per_page
    offset v_offset
  ) t;

  return jsonb_build_object(
    'services', v_rows,
    'total', v_total,
    'page', p_page,
    'itemsPerPage', p_items_per_page
  );
end;
$$;

create or replace function public.rpc_upsert_service(
  p_requester_id uuid,
  p_name text,
  p_service_id uuid default null,
  p_code text default null,
  p_category text default null,
  p_color text default null,
  p_duration_minutes integer default null,
  p_price numeric default null,
  p_cost numeric default null,
  p_active boolean default true
) returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
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

  if p_service_id is null then
    insert into public.clinic_services (
      clinic_id, code, name, category, color, duration_minutes, price, cost, active, created_at, updated_at
    ) values (
      v_clinic_id,
      nullif(trim(p_code), ''),
      trim(p_name),
      nullif(trim(p_category), ''),
      nullif(trim(p_color), ''),
      p_duration_minutes,
      p_price,
      p_cost,
      coalesce(p_active, true),
      now(),
      now()
    )
    returning id into v_id;
    return v_id;
  end if;

  -- ensure service belongs to the clinic
  if not exists (
    select 1 from public.clinic_services s
    where s.id = p_service_id and s.clinic_id = v_clinic_id
  ) then
    raise exception 'Service not found or access denied';
  end if;

  update public.clinic_services
  set
    code = nullif(trim(p_code), ''),
    name = trim(p_name),
    category = nullif(trim(p_category), ''),
    color = nullif(trim(p_color), ''),
    duration_minutes = p_duration_minutes,
    price = p_price,
    cost = p_cost,
    active = coalesce(p_active, active),
    updated_at = now()
  where id = p_service_id
    and clinic_id = v_clinic_id
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.rpc_set_service_active(
  p_requester_id uuid,
  p_service_id uuid,
  p_active boolean
) returns boolean
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

  update public.clinic_services
  set active = coalesce(p_active, false), updated_at = now()
  where id = p_service_id and clinic_id = v_clinic_id;

  if not found then
    raise exception 'Service not found or access denied';
  end if;

  return true;
end;
$$;

-- Minimal expenses list/create (optional)
create or replace function public.rpc_get_expenses(
  p_requester_id uuid,
  p_start_date timestamptz default null,
  p_end_date timestamptz default null,
  p_page integer default 1,
  p_items_per_page integer default 50
) returns jsonb
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
  select clinic_id into v_clinic_id
  from public.users_metadata
  where id = p_requester_id and active = true
  limit 1;

  if v_clinic_id is null then
    raise exception 'Requester has no clinic';
  end if;

  v_offset := greatest((p_page - 1) * p_items_per_page, 0);

  select count(*) into v_total
  from public.clinic_expenses e
  where e.clinic_id = v_clinic_id
    and (p_start_date is null or e.spent_at >= p_start_date)
    and (p_end_date is null or e.spent_at <= p_end_date);

  select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
  into v_rows
  from (
    select
      e.id,
      e.clinic_id,
      e.category,
      e.amount,
      e.notes,
      e.spent_at,
      e.created_at
    from public.clinic_expenses e
    where e.clinic_id = v_clinic_id
      and (p_start_date is null or e.spent_at >= p_start_date)
      and (p_end_date is null or e.spent_at <= p_end_date)
    order by e.spent_at desc
    limit p_items_per_page
    offset v_offset
  ) t;

  return jsonb_build_object(
    'expenses', v_rows,
    'total', v_total,
    'page', p_page,
    'itemsPerPage', p_items_per_page
  );
end;
$$;

create or replace function public.rpc_create_expense(
  p_requester_id uuid,
  p_amount numeric,
  p_category text default null,
  p_notes text default null,
  p_spent_at timestamptz default null
) returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
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

  insert into public.clinic_expenses (
    clinic_id, category, amount, notes, spent_at, created_at
  ) values (
    v_clinic_id,
    nullif(trim(p_category), ''),
    p_amount,
    nullif(trim(p_notes), ''),
    coalesce(p_spent_at, now()),
    now()
  )
  returning id into v_id;

  return v_id;
end;
$$;

commit;
