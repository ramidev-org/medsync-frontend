-- Large dev seed for the frontend (patients, visits, payments, cabinets)
--
-- Prereqs:
-- - Run `database/sql/000_all_changes.sql`
-- - Run `database/sql/010_seed_dev.sql` (creates auth trigger + base RLS)
--
-- Notes:
-- - Your `public.profiles.id` has a FK to `auth.users.id` (profiles_id_fkey), so we CANNOT
--   insert "fake" profiles. You must create a real Auth user first, then run the seed
--   function below with that user's email.

begin;

/* =========================================================
   0) Fix constraints that block multiple "cabinets"
   ========================================================= */

-- Your schema snapshot had unique indexes that only allow ONE cabinet per admin/doctor.
-- Drop them so you can have multiple virtual clinics (cabinets).
alter table public.virtual_clinics drop constraint if exists virtual_clinics_doctor_id_key;
alter table public.virtual_clinics drop constraint if exists virtual_clinics_created_by_admin_key;
drop index if exists public.virtual_clinics_doctor_id_key;
drop index if exists public.virtual_clinics_created_by_admin_key;

create index if not exists idx_virtual_clinics_doctor_id on public.virtual_clinics (doctor_id);
create index if not exists idx_virtual_clinics_created_by_admin on public.virtual_clinics (created_by_admin);

/* =========================================================
   1) Missing columns/tables used by the frontend
   ========================================================= */

-- Payments page expects patients.code
alter table public.patients add column if not exists code text;
create unique index if not exists patients_code_key on public.patients (code);

-- Optional but useful for filtering (frontend may add this later)
alter table public.patients add column if not exists clinic_id uuid;
do $$
begin
  if not exists (
    select 1
    from information_schema.table_constraints
    where constraint_schema = 'public'
      and table_name = 'patients'
      and constraint_name = 'patients_clinic_id_fkey'
  ) then
    alter table public.patients
      add constraint patients_clinic_id_fkey
      foreign key (clinic_id) references public.clinics(id) on delete set null;
  end if;
end $$;

-- Visits/appointments (used by services/* and future UI wiring)
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid references public.clinics(id) on delete set null,
  patient_id uuid not null references public.patients(id) on delete cascade,
  doctor_id uuid references public.profiles(id) on delete set null,
  scheduled_at timestamptz not null default now(),
  status text not null default 'pending', -- pending | in_consultation | completed | cancelled
  type text not null default 'consultation',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_appointments_updated on public.appointments;
create trigger trg_appointments_updated
before update on public.appointments
for each row execute function public.update_updated_at();

create index if not exists idx_appointments_patient_id on public.appointments (patient_id);
create index if not exists idx_appointments_doctor_id on public.appointments (doctor_id);
create index if not exists idx_appointments_clinic_date on public.appointments (clinic_id, scheduled_at desc);

-- Payments (used by `services/payments.services.ts`)
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid references public.clinics(id) on delete set null,
  visit_id uuid references public.appointments(id) on delete set null,
  patient_id uuid not null references public.patients(id) on delete cascade,
  amount numeric not null,
  method text not null default 'cash',    -- cash | card | transfer | mobile_money
  status text not null default 'paid',    -- paid | pending | failed | refunded
  reference text,
  created_at timestamptz not null default now()
);

create index if not exists idx_payments_patient_id on public.payments (patient_id);
create index if not exists idx_payments_visit_id on public.payments (visit_id);
create index if not exists idx_payments_created_at on public.payments (created_at desc);

/* =========================================================
   2) RLS policies (dev-friendly)
   ========================================================= */

-- For dev/demo we allow authenticated reads across these tables so the UI can show data.
-- Tighten these to clinic-based rules for production.

alter table public.patients enable row level security;
drop policy if exists "patients_select_authenticated" on public.patients;
create policy "patients_select_authenticated"
on public.patients for select to authenticated
using (true);

alter table public.patient_medical_info enable row level security;
drop policy if exists "patient_medical_info_select_authenticated" on public.patient_medical_info;
create policy "patient_medical_info_select_authenticated"
on public.patient_medical_info for select to authenticated
using (true);

alter table public.patient_measurements enable row level security;
drop policy if exists "patient_measurements_select_authenticated" on public.patient_measurements;
create policy "patient_measurements_select_authenticated"
on public.patient_measurements for select to authenticated
using (true);

alter table public.appointments enable row level security;
drop policy if exists "appointments_select_authenticated" on public.appointments;
create policy "appointments_select_authenticated"
on public.appointments for select to authenticated
using (true);

alter table public.payments enable row level security;
drop policy if exists "payments_select_authenticated" on public.payments;
create policy "payments_select_authenticated"
on public.payments for select to authenticated
using (true);

/* =========================================================
   3) Seed function (requires a real Auth user)
   ========================================================= */

create or replace function public.seed_large_dev(p_admin_email text)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_admin_id uuid;
  v_clinic_id uuid := '11111111-1111-1111-1111-111111111111'::uuid;
begin
  select u.id into v_admin_id
  from auth.users u
  where lower(u.email) = lower(p_admin_email)
  limit 1;

  if v_admin_id is null then
    raise exception 'Auth user not found for email %. Create the user in Supabase Auth first, then re-run.', p_admin_email;
  end if;

  -- Ensure the demo clinic exists
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
    v_clinic_id,
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
  on conflict (id) do nothing;

  -- Ensure specialities exist (virtual clinics depend on them)
  insert into public.doctor_specialities (name)
  values
    ('Cardiologie'),
    ('Dermatologie'),
    ('Gynecologie'),
    ('Medecine generale')
  on conflict (name) do nothing;

  -- Ensure profile + role exist for the admin user
  insert into public.profiles (id, username, full_name, email, clinic_id, active)
  select
    u.id,
    coalesce(nullif(u.raw_user_meta_data->>'username',''), 'admin-' || substring(u.id::text, 1, 6)),
    coalesce(nullif(u.raw_user_meta_data->>'full_name',''), split_part(u.email, '@', 1), 'Admin'),
    u.email,
    v_clinic_id,
    true
  from auth.users u
  where u.id = v_admin_id
  on conflict (id) do update set
    clinic_id = excluded.clinic_id,
    email = excluded.email;

  insert into public.user_roles (user_id, role, assigned_by)
  values (v_admin_id, 'doctor', null)
  on conflict (user_id, role) do nothing;

  insert into public.doctor_profiles (id, speciality, license_number, years_of_experience, consultation_fee, bio, active)
  values (
    v_admin_id,
    'Medecine generale',
    'MD-DEMO-ADMIN',
    10,
    15000,
    'Compte admin pour tests UI.',
    true
  )
  on conflict (id) do nothing;

  update public.clinics
  set admin_id = v_admin_id
  where id = v_clinic_id;

  -- Seed 3 "cabinets" as virtual clinics
  insert into public.virtual_clinics (id, clinic_id, speciality_id, doctor_id, created_by_admin, active)
  values
    (
      '20000000-0000-0000-0000-000000000001'::uuid,
      v_clinic_id,
      (select id from public.doctor_specialities where name = 'Cardiologie' limit 1),
      v_admin_id,
      v_admin_id,
      true
    ),
    (
      '20000000-0000-0000-0000-000000000002'::uuid,
      v_clinic_id,
      (select id from public.doctor_specialities where name = 'Dermatologie' limit 1),
      null,
      v_admin_id,
      true
    ),
    (
      '20000000-0000-0000-0000-000000000003'::uuid,
      v_clinic_id,
      (select id from public.doctor_specialities where name = 'Gynecologie' limit 1),
      null,
      v_admin_id,
      true
    )
  on conflict (id) do nothing;

  /* =========================================================
     4) Seed 20 patients (detailed) + medical info + measurements
     ========================================================= */

-- Helper: deterministic-ish patient codes
with seed as (
  select
    gs as n,
    lpad(gs::text, 4, '0') as nn
  from generate_series(1, 20) gs
)
insert into public.patients (
  created_by,
  clinic_id,
  code,
  national_id,
  medical_record_number,
  first_name,
  last_name,
  date_of_birth,
  place_of_birth,
  age,
  sex,
  marital_status,
  phone,
  email,
  address_street,
  address_city,
  address_state,
  emergency_contact_name,
  emergency_contact_relationship,
  emergency_contact_phone,
  insurance_provider,
  insurance_policy_number,
  created_at
)
select
  v_admin_id as created_by,
  v_clinic_id as clinic_id,
  'PT' || nn as code,
  'NIN' || nn as national_id,
  'MRN' || nn as medical_record_number,
  case n
    when 1 then 'Amina' when 2 then 'Chinedu' when 3 then 'Fatou' when 4 then 'Ibrahim' when 5 then 'Kemi'
    when 6 then 'Tunde' when 7 then 'Ngozi' when 8 then 'Samuel' when 9 then 'Zainab' when 10 then 'Hassan'
    when 11 then 'Blessing' when 12 then 'Emeka' when 13 then 'Mariam' when 14 then 'David' when 15 then 'Sade'
    when 16 then 'John' when 17 then 'Grace' when 18 then 'Peter' when 19 then 'Aisha' else 'Paul'
  end as first_name,
  case n
    when 1 then 'Okoye' when 2 then 'Adeyemi' when 3 then 'Diallo' when 4 then 'Abubakar' when 5 then 'Balogun'
    when 6 then 'Ifeanyi' when 7 then 'Eze' when 8 then 'Johnson' when 9 then 'Yusuf' when 10 then 'Musa'
    when 11 then 'Ojo' when 12 then 'Nwosu' when 13 then 'Traore' when 14 then 'Olawale' when 15 then 'Akinyemi'
    when 16 then 'Smith' when 17 then 'Bello' when 18 then 'Okafor' when 19 then 'Suleiman' else 'Umeh'
  end as last_name,
  (date '1985-01-01' + ((n * 137) % 9000) * interval '1 day')::date as date_of_birth,
  case when (n % 2) = 0 then 'Lagos' else 'Abuja' end as place_of_birth,
  null as age,
  case when (n % 2) = 0 then 'male'::sex_enum else 'female'::sex_enum end as sex,
  case
    when (n % 3) = 0 then 'married'::marital_status_enum
    when (n % 5) = 0 then 'divorced'::marital_status_enum
    else 'single'::marital_status_enum
  end as marital_status,
  '+23480' || (10000000 + (n * 43121) % 89999999)::text as phone,
  'patient' || nn || '@demo.local' as email,
  'Street ' || n as address_street,
  case when (n % 2) = 0 then 'Ikeja' else 'Garki' end as address_city,
  case when (n % 2) = 0 then 'Lagos' else 'FCT' end as address_state,
  case when (n % 2) = 0 then 'Relative ' || n else 'Family ' || n end as emergency_contact_name,
  case when (n % 2) = 0 then 'Sibling' else 'Parent' end as emergency_contact_relationship,
  '+23481' || (10000000 + (n * 71231) % 89999999)::text as emergency_contact_phone,
  case when (n % 4) = 0 then 'NHIS' else 'Private' end as insurance_provider,
  'POL' || nn || '-DEMO' as insurance_policy_number,
  now() - (n * interval '3 days') as created_at
from seed
on conflict do nothing;

-- Create medical info for patients that don't have one yet
insert into public.patient_medical_info (
  patient_id,
  blood_type,
  allergies,
  chronic_diseases,
  medications,
  disabilities,
  created_at
)
select
  p.id,
  (array['A+','A-','B+','B-','AB+','AB-','O+','O-'])[((substring(p.code from 3)::int % 8) + 1)]::blood_type_enum,
  case when (substring(p.code from 3)::int % 4) = 0 then array['penicillin'] else array[]::text[] end,
  case when (substring(p.code from 3)::int % 5) = 0 then array['hypertension'] else array[]::text[] end,
  case when (substring(p.code from 3)::int % 6) = 0 then array['metformin'] else array[]::text[] end,
  array[]::text[] as disabilities,
  now()
from public.patients p
left join public.patient_medical_info mi on mi.patient_id = p.id
where p.code like 'PT%'
  and mi.patient_id is null;

-- 3 measurement rows per patient
insert into public.patient_measurements (
  patient_id,
  recorded_by,
  weight,
  height,
  bmi,
  temperature,
  systolic_bp,
  diastolic_bp,
  oxygen_saturation,
  recorded_at,
  notes
)
select
  p.id,
  v_admin_id,
  (60 + (n % 30))::numeric as weight,
  (155 + (n % 25))::numeric as height,
  null,
  (36 + ((n % 10)::numeric / 10))::numeric as temperature,
  (110 + (n % 30))::int as systolic_bp,
  (70 + (n % 20))::int as diastolic_bp,
  (94 + (n % 6))::int as oxygen_saturation,
  now() - (k * interval '14 days') as recorded_at,
  case when k = 0 then 'Initial check' when k = 1 then 'Follow-up' else 'Routine' end as notes
from public.patients p
join lateral (
  select
    (substring(p.code from 3)::int) as n
) s on true
join lateral (
  select 0 as k union all select 1 union all select 2
) ks on true
where p.code like 'PT%';

/* =========================================================
   5) Seed appointments + payments
   ========================================================= */

-- 30 appointments across the seeded patients
with pat as (
  select id, clinic_id, code
  from public.patients
  where code like 'PT%'
  order by code
  limit 20
),
seed as (
  select
    row_number() over () as n,
    id as patient_id,
    clinic_id
  from pat
)
insert into public.appointments (
  clinic_id,
  patient_id,
  doctor_id,
  scheduled_at,
  status,
  type,
  notes
)
select
  s.clinic_id,
  s.patient_id,
  v_admin_id as doctor_id,
  now() - ((s.n % 12) * interval '1 day') + ((s.n % 8) * interval '2 hours') as scheduled_at,
  case
    when (s.n % 7) = 0 then 'cancelled'
    when (s.n % 5) = 0 then 'completed'
    when (s.n % 3) = 0 then 'in_consultation'
    else 'pending'
  end as status,
  case when (s.n % 4) = 0 then 'follow_up' else 'consultation' end as type,
  case when (s.n % 2) = 0 then 'Patient complained of headache.' else 'Routine check.' end as notes
from seed s
union all
select
  s.clinic_id,
  s.patient_id,
  v_admin_id,
  now() + ((s.n % 10) * interval '1 day') + ((s.n % 6) * interval '3 hours'),
  'pending',
  'consultation',
  'Upcoming appointment.'
from seed s
where s.n <= 10;

-- 40 payments tied to random-ish appointments/patients
with v as (
  select a.id as visit_id, a.patient_id, a.clinic_id, a.scheduled_at
  from public.appointments a
  order by a.scheduled_at desc
  limit 40
),
seed as (
  select row_number() over () as n, *
  from v
)
insert into public.payments (
  clinic_id,
  visit_id,
  patient_id,
  amount,
  method,
  status,
  reference,
  created_at
)
select
  s.clinic_id,
  s.visit_id,
  s.patient_id,
  (10000 + (s.n % 8) * 2500)::numeric as amount,
  (array['cash','card','transfer','mobile_money'])[(s.n % 4) + 1] as method,
  case when (s.n % 9) = 0 then 'pending' else 'paid' end as status,
  'PAY-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(s.n::text, 4, '0') as reference,
  s.scheduled_at + interval '30 minutes' as created_at
from seed s;

/* =========================================================
   6) Finish
   ========================================================= */
end;
$$;

commit;

-- Convenience wrapper if you prefer using the user's UUID instead of email:
create or replace function public.seed_large_dev_by_id(p_admin_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_email text;
begin
  select u.email into v_email
  from auth.users u
  where u.id = p_admin_id
  limit 1;

  if v_email is null then
    raise exception 'Auth user not found for id %', p_admin_id;
  end if;

  perform public.seed_large_dev(v_email);
end;
$$;

-- Run this AFTER the function is created:
-- - By email:
--   select public.seed_large_dev('admin@example.com');
-- - By user id (uuid):
--   select public.seed_large_dev_by_id('00000000-0000-0000-0000-000000000000');
