-- Cleanup for legacy specialty-specific consultation tables.
--
-- Use this only if you are standardizing on the shared consultation model:
--   public.consultations.speciality_payload
--   public.consultations.shared_payload
--   public.consultation_observations.data
--
-- This script is intentionally conservative:
-- - It reports row counts first.
-- - It refuses to drop a table if it still contains data.
-- - It does not use CASCADE.
-- - If another object still depends on a table, PostgreSQL will stop with an error.

begin;

-- 1) Review candidate table row counts before dropping anything.
select 'consultation_cardiology' as table_name, count(*) as row_count from public.consultation_cardiology
union all
select 'consultation_dermatology', count(*) from public.consultation_dermatology
union all
select 'consultation_orthopedics', count(*) from public.consultation_orthopedics
union all
select 'consultation_gynecology_obstetrics', count(*) from public.consultation_gynecology_obstetrics
union all
select 'consultation_dentistry', count(*) from public.consultation_dentistry;

-- 2) Guarded drop helper.
create or replace function public._drop_table_if_empty(p_table_name text)
returns void
language plpgsql
as $$
declare
  v_count bigint;
begin
  execute format('select count(*) from public.%I', p_table_name) into v_count;

  if v_count > 0 then
    raise exception 'Refusing to drop %. Table still contains % row(s). Migrate/archive data first.', p_table_name, v_count;
  end if;

  execute format('drop table if exists public.%I', p_table_name);
end;
$$;

-- 3) Drop only if empty.
select public._drop_table_if_empty('consultation_cardiology');
select public._drop_table_if_empty('consultation_dermatology');
select public._drop_table_if_empty('consultation_orthopedics');
select public._drop_table_if_empty('consultation_gynecology_obstetrics');
select public._drop_table_if_empty('consultation_dentistry');

-- 4) Remove helper.
drop function if exists public._drop_table_if_empty(text);

commit;

-- Optional next-pass review candidates for a smaller v1 SaaS scope.
-- Do not drop these automatically unless you have confirmed the module is cut:
--   public.virtual_clinics
--   public.doctor_specialities
--   public.clinic_speciality_tools
--   public.clinic_expenses
--   public.clinic_invoices
--   public.lab_test_catalog
--   public.lab_test_panels
--   public.lab_test_panel_items
--   public.lab_orders
--   public.lab_order_items
--   public.lab_results
--   public.treatment_cases
--   public.speciality_field_definitions
--   public.doctor_field_preferences
--   public.doctor_profile_specialities
