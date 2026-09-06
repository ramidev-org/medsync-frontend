-- All database changes (single file)
-- Run in Supabase SQL editor (recommended order already respected).

/* =========================================================
   1) Reception refactor (assistant -> reception)
   ========================================================= */

-- Keep existing assistant_profiles table, but expose a stable name for the app.
-- This avoids a breaking rename and lets the app query `reception_profiles`.
create or replace view public.reception_profiles as
select * from public.assistant_profiles;

-- Update roles to the new name
update public.user_roles
set role = 'reception'
where role = 'assistant';

/* =========================================================
   2) Drugs catalog (official columns)
   ========================================================= */

-- Optional (recommended) for fast ILIKE search; enable if you have permissions:
-- create extension if not exists pg_trgm;

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

/* =========================================================
   3) Seed sample drugs (optional)
   ========================================================= */

insert into public.drugs (code, brand_name, form, dosage, active) values
  ('D0001', 'GRIPEX ALLERGIE', 'Comprimé', '10MG', true),
  ('D0002', 'GRIPEX GLES', 'Microgranules', '50MG/4MG', true),
  ('D0003', 'GRIPEX PLUS', 'Comprimé', '200MG/30MG', true),
  ('D0004', 'GRIPEX TOUX GRASSE', 'Solution buvable', '5%', true),
  ('D0005', 'AUGMENTIN', 'Comprimé', '500MG/125MG', true),
  ('D0006', 'DOLIPRANE', 'Comprimé', '1000MG', true),
  ('D0007', 'SPASFON', 'Comprimé', '80MG', true)
on conflict do nothing;

