-- Critical fix (claude-review.md §2c): no table in this schema had row level
-- security enabled. Combined with the client-side RPC fallbacks that queried
-- tables directly (removed in this same change), an authenticated user from
-- clinic A could read or write clinic B's data simply by supplying a
-- different clinic_id / patient_id from the browser.
--
-- All existing RPCs are `security definer` owned by a superuser role, so they
-- keep working unchanged: RLS is only enforced for direct PostgREST/table
-- access using the authenticated user's own role.
--
-- This only covers tables whose schema is defined in this repo, or whose
-- shape is documented in claude-review.md. Run the verification query from
-- the review against the live database and extend this file for any
-- additional tenant table it turns up:
--
--   select relname, relrowsecurity from pg_class c
--   join pg_namespace n on n.oid = c.relnamespace
--   where n.nspname = 'public' and c.relkind = 'r' order by 2, 1;

create or replace function public.current_clinic_id()
returns uuid
language sql
stable
security definer
set search_path to 'public'
as $function$
  select clinic_id
  from public.users_metadata
  where id = auth.uid()
    and active = true
  limit 1;
$function$;

-- Tables with a direct clinic_id column.
do $$
declare
  t text;
begin
  foreach t in array array[
    'patients',
    'appointments',
    'prescriptions',
    'financial_transactions',
    'clinic_tasks',
    'lab_orders'
  ]
  loop
    if to_regclass('public.' || t) is not null then
      execute format('alter table public.%I enable row level security', t);
      execute format('drop policy if exists tenant_isolation on public.%I', t);
      execute format(
        'create policy tenant_isolation on public.%I for all using (clinic_id = public.current_clinic_id()) with check (clinic_id = public.current_clinic_id())',
        t
      );
    end if;
  end loop;
end $$;

-- users_metadata: no clinic_id predicate (that would lock a user out of
-- their own row before it resolves); scope to same clinic or self.
alter table if exists public.users_metadata enable row level security;
drop policy if exists tenant_isolation on public.users_metadata;
create policy tenant_isolation on public.users_metadata
  for all
  using (id = auth.uid() or clinic_id = public.current_clinic_id())
  with check (id = auth.uid() or clinic_id = public.current_clinic_id());

-- Tables that reach their clinic only through a parent row (no clinic_id
-- column of their own).
alter table if exists public.payments enable row level security;
drop policy if exists tenant_isolation on public.payments;
create policy tenant_isolation on public.payments
  for all
  using (
    exists (
      select 1 from public.patients p
      where p.id = payments.patient_id
        and p.clinic_id = public.current_clinic_id()
    )
  )
  with check (
    exists (
      select 1 from public.patients p
      where p.id = payments.patient_id
        and p.clinic_id = public.current_clinic_id()
    )
  );

alter table if exists public.prescription_medication_rows enable row level security;
drop policy if exists tenant_isolation on public.prescription_medication_rows;
create policy tenant_isolation on public.prescription_medication_rows
  for all
  using (
    exists (
      select 1 from public.prescriptions pr
      where pr.id = prescription_medication_rows.prescription_id
        and pr.clinic_id = public.current_clinic_id()
    )
  )
  with check (
    exists (
      select 1 from public.prescriptions pr
      where pr.id = prescription_medication_rows.prescription_id
        and pr.clinic_id = public.current_clinic_id()
    )
  );

alter table if exists public.conversation_reads enable row level security;
drop policy if exists tenant_isolation on public.conversation_reads;
create policy tenant_isolation on public.conversation_reads
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
