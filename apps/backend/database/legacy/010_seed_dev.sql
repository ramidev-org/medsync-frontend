-- Dev seed + auth->profile bootstrap for Supabase
--
-- Goal:
-- - Avoid 406 on `public.profiles` after sign-in by ensuring every auth user gets a profile row.
-- - Provide minimal RLS policies so authenticated users can read their own data.
-- - Seed small reference data (doctor specialities, demo clinic).
--
-- Usage (Supabase SQL editor):
-- 1) Run your base schema/migrations first.
-- 2) Run this file.
-- 3) Create users in Supabase Auth (Dashboard) and set user metadata:
--    - role: "doctor" | "reception"
--    - clinic_id: "<uuid>" (optional; use the demo clinic id from this file)
--    - full_name, username, speciality (optional)

begin;

/* =========================================================
   1) Compatibility view: reception_profiles -> assistant_profiles
   ========================================================= */

create or replace view public.reception_profiles as
select * from public.assistant_profiles;

/* =========================================================
   2) Reference data (safe upserts)
   ========================================================= */

-- Doctor specialities shown in the app
insert into public.doctor_specialities (name)
values
  ('Cardiologie'),
  ('Dermatologie'),
  ('Gynecologie'),
  ('Medecine generale')
on conflict (name) do nothing;

-- Demo clinic (use this id in Auth user metadata: clinic_id)
insert into public.clinics (
  id,
  name,
  clinic_code,
  max_doctors,
  max_assistants,
  tier_plan,
  state,
  city,
  street,
  google_maps_address
)
values (
  '11111111-1111-1111-1111-111111111111'::uuid,
  'Demo Clinic',
  'DEMO001',
  10,
  10,
  'dev',
  'Lagos',
  'Lagos',
  'Demo street',
  null
)
on conflict (id) do update set
  name = excluded.name,
  clinic_code = excluded.clinic_code;

/* =========================================================
   3) Auth bootstrap: auto-create profile/role rows on signup
   ========================================================= */

-- Creates a public profile row + a single role row.
-- Reads role/clinic/speciality from auth user metadata (raw_user_meta_data).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_username text;
  v_full_name text;
  v_speciality text;
  v_clinic_id uuid;
begin
  v_role := coalesce(new.raw_user_meta_data->>'role', 'reception');
  if lower(v_role) = 'assistant' then
    v_role := 'reception';
  end if;
  v_role := lower(v_role);

  v_full_name := coalesce(
    nullif(new.raw_user_meta_data->>'full_name', ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'User'
  );

  v_username := coalesce(nullif(new.raw_user_meta_data->>'username', ''), '');
  if v_username = '' then
    v_username :=
      regexp_replace(lower(split_part(coalesce(new.email, 'user'), '@', 1)), '[^a-z0-9_-]', '', 'g')
      || '-'
      || substring(new.id::text, 1, 6);
  end if;

  v_speciality := coalesce(nullif(new.raw_user_meta_data->>'speciality', ''), 'Medecine generale');

  v_clinic_id := nullif(new.raw_user_meta_data->>'clinic_id', '')::uuid;

  insert into public.profiles (id, username, full_name, email, clinic_id, active)
  values (new.id, v_username, v_full_name, new.email, v_clinic_id, true)
  on conflict (id) do update set
    email = excluded.email,
    clinic_id = coalesce(excluded.clinic_id, public.profiles.clinic_id);

  insert into public.user_roles (user_id, role, assigned_by)
  values (new.id, v_role, null)
  on conflict (user_id, role) do nothing;

  if v_role = 'doctor' then
    insert into public.doctor_profiles (id, speciality, active)
    values (new.id, v_speciality, true)
    on conflict (id) do nothing;
  elsif v_role = 'reception' then
    insert into public.assistant_profiles (id, department, active)
    values (new.id, 'Front desk', true)
    on conflict (id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

/* =========================================================
   4) Minimal RLS policies for sign-in + profile loading
   ========================================================= */

-- profiles
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- user_roles (read own role)
alter table public.user_roles enable row level security;

drop policy if exists "user_roles_select_own" on public.user_roles;
create policy "user_roles_select_own"
on public.user_roles
for select
to authenticated
using (user_id = auth.uid());

-- doctor_profiles (read own)
alter table public.doctor_profiles enable row level security;

drop policy if exists "doctor_profiles_select_own" on public.doctor_profiles;
create policy "doctor_profiles_select_own"
on public.doctor_profiles
for select
to authenticated
using (id = auth.uid());

-- assistant_profiles (read own)
alter table public.assistant_profiles enable row level security;

drop policy if exists "assistant_profiles_select_own" on public.assistant_profiles;
create policy "assistant_profiles_select_own"
on public.assistant_profiles
for select
to authenticated
using (id = auth.uid());

-- clinics (allow authenticated read; tighten later if needed)
alter table public.clinics enable row level security;

drop policy if exists "clinics_select_authenticated" on public.clinics;
create policy "clinics_select_authenticated"
on public.clinics
for select
to authenticated
using (true);

-- doctor_specialities (allow authenticated read)
alter table public.doctor_specialities enable row level security;

drop policy if exists "doctor_specialities_select_authenticated" on public.doctor_specialities;
create policy "doctor_specialities_select_authenticated"
on public.doctor_specialities
for select
to authenticated
using (true);

commit;

