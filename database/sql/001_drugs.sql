-- Drugs catalog (for Ordonnance / prescriptions)
-- Goal: searchable drug list (official columns) without over-complicating.
--
-- Recommended extensions (optional but strongly recommended for fast search):
--   create extension if not exists pg_trgm;
--
-- Notes:
-- - Keep drugs global (not per clinic) unless you truly need per-clinic pricing/stock later.
-- - Store "components" as JSONB for simplicity; normalize later only if needed.

create table if not exists public.drugs (
  id uuid primary key default gen_random_uuid(),

  -- Required dataset columns (English labels)
  code text not null,
  brand_name text not null,
  form text,
  dosage text,
  marketing_authorization_holder text,
  marketing_authorization_holder_country text,
  registration_date_final date,

  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists drugs_code_uq on public.drugs (code);

-- Optional: prevent exact duplicates (adjust as needed for your dataset)
create unique index if not exists drugs_brand_form_dosage_uq
  on public.drugs (brand_name, coalesce(form, ''), coalesce(dosage, ''));

-- Optional (requires pg_trgm): fast ILIKE search on brand_name/code
-- create index if not exists drugs_brand_name_trgm_idx
--   on public.drugs using gin (brand_name gin_trgm_ops);
-- create index if not exists drugs_code_trgm_idx
--   on public.drugs using gin (code gin_trgm_ops);

-- Keep updated_at in sync (assumes you already have public.update_updated_at())
drop trigger if exists trg_drugs_updated on public.drugs;
create trigger trg_drugs_updated
before update on public.drugs
for each row execute function public.update_updated_at();

-- RLS (Supabase): keep it simple
alter table public.drugs enable row level security;

drop policy if exists "drugs_read_authenticated" on public.drugs;
create policy "drugs_read_authenticated"
on public.drugs for select
to authenticated
using (active = true);

-- Write access should be restricted (service role / admins via Edge Function).
-- If you want doctors to suggest new drugs later, implement a separate "drug_suggestions" table.
