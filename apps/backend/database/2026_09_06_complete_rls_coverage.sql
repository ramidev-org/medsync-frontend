-- Completes the tenant isolation started in 2026_08_26_enable_rls_tenant_tables.sql.
--
-- That migration protected six tables by name and left a comment asking for a
-- verification query to be run against the live database to catch the rest.
-- That follow-up never happened, so roughly half the tenant tables still carry
-- a clinic_id with no policy - including patient_medical_info (allergies,
-- chronic diseases), patient_measurements (vitals), consultation_diagnoses,
-- consultation_documents (DICOM references), prescription_lines and
-- clinic_messages.
--
-- It also targeted two tables that do not exist under those names, and because
-- every statement was guarded with `to_regclass(...) is not null` /
-- `alter table if exists`, both no-opped in silence at deploy time:
--
--   prescription_medication_rows -> the live table is prescription_lines,
--                                   which has its own clinic_id and is better
--                                   protected directly than through a parent
--   payments                     -> this role is filled by
--                                   financial_transactions, already covered
--
-- Scope of the exposure: every RPC is `security definer` and therefore
-- unaffected either way - normal application traffic was always scoped
-- correctly. What was reachable is direct PostgREST table access with the anon
-- key and any valid session, which is the path the app itself uses in
-- appData_context.tsx, users.tsx and _consultation_charts.tsx.
--
-- This migration is driven by the catalog rather than another hand-written
-- list, so a table added later with a clinic_id is picked up by re-running it
-- instead of drifting out of coverage the way the last list did.

-- ---------------------------------------------------------------------------
-- 1. Every table with a clinic_id column gets the standard tenant policy.
-- ---------------------------------------------------------------------------
-- Two tables are deliberately excluded because they already carry a *narrower*
-- policy that this one would widen:
--
--   users_metadata     - needs `id = auth.uid() or clinic_id = ...`, because a
--                        clinic-only predicate locks a user out of their own
--                        row before their clinic can be resolved from it.
--   conversation_reads - scoped to `user_id = auth.uid()`; clinic scoping would
--                        expose every colleague's read receipts.
--   *_profiles         - same self-or-clinic shape, applied in step 1b below.

do $$
declare
  r record;
  v_count int := 0;
begin
  for r in
    select c.relname as table_name
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'r'
      and exists (
        select 1
        from pg_attribute a
        where a.attrelid = c.oid
          and a.attname = 'clinic_id'
          and a.attnum > 0
          and not a.attisdropped
      )
      and c.relname <> all (array[
        'users_metadata',
        'conversation_reads',
        'doctor_profiles',
        'assistant_profiles'
      ])
    order by c.relname
  loop
    execute format('alter table public.%I enable row level security', r.table_name);
    execute format('drop policy if exists tenant_isolation on public.%I', r.table_name);
    execute format(
      'create policy tenant_isolation on public.%I for all '
      'using (clinic_id = public.current_clinic_id()) '
      'with check (clinic_id = public.current_clinic_id())',
      r.table_name
    );

    v_count := v_count + 1;
    raise notice 'tenant_isolation -> %', r.table_name;
  end loop;

  raise notice '% clinic_id tables now carry tenant_isolation', v_count;
end $$;

-- ---------------------------------------------------------------------------
-- 1b. Profile tables - self OR clinic, never clinic alone.
-- ---------------------------------------------------------------------------
-- auth_context.tsx reads these directly with `.eq("id", auth.uid())` on every
-- sign-in. A clinic-only predicate would hide the row whenever its clinic_id is
-- null - `null = uuid` is null, not false - and the failure mode is silent:
-- the profile comes back empty and the user loses their role data at login
-- rather than seeing an error. Self-access removes that dependency entirely.
--
-- These tables are not in the schema dump this migration was written against,
-- so each block is guarded; if a table is absent, nothing happens.

do $$
declare
  t text;
begin
  foreach t in array array['doctor_profiles', 'assistant_profiles']
  loop
    if to_regclass('public.' || t) is null then
      raise notice 'skipped (absent): %', t;
      continue;
    end if;

    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists tenant_isolation on public.%I', t);

    -- Only add the clinic arm when the column is actually there.
    if exists (
      select 1
      from pg_attribute a
      where a.attrelid = to_regclass('public.' || t)
        and a.attname = 'clinic_id'
        and a.attnum > 0
        and not a.attisdropped
    ) then
      execute format(
        'create policy tenant_isolation on public.%I for all '
        'using (id = auth.uid() or clinic_id = public.current_clinic_id()) '
        'with check (id = auth.uid() or clinic_id = public.current_clinic_id())',
        t
      );
      raise notice 'tenant_isolation (self or clinic) -> %', t;
    else
      execute format(
        'create policy tenant_isolation on public.%I for all '
        'using (id = auth.uid()) with check (id = auth.uid())',
        t
      );
      raise notice 'tenant_isolation (self only, no clinic_id column) -> %', t;
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 2. clinics - scoped by primary key, not by a clinic_id column.
-- ---------------------------------------------------------------------------
-- appData_context.tsx reads this table directly on every app load, so it needs
-- a policy rather than a blanket deny. Clinic creation runs through the
-- activate-clinic edge function on the service role, which bypasses RLS.

alter table if exists public.clinics enable row level security;
drop policy if exists tenant_isolation on public.clinics;
create policy tenant_isolation on public.clinics
  for all
  using (id = public.current_clinic_id())
  with check (id = public.current_clinic_id());

-- ---------------------------------------------------------------------------
-- 3. licenses - the platform's own licensing control.
-- ---------------------------------------------------------------------------
-- This table holds license_key and a signed `payload` blob, and it is read
-- straight from the client in appData_context.tsx. Row access in PostgREST is
-- not column-scoped, so a session asking for more than the two columns the app
-- selects would have received license_key and payload for every license in the
-- system.
--
-- Two layers, because either alone is insufficient:
--   a) a row policy limiting a session to the license its own clinic points at
--   b) column grants, so even that row exposes only what the client needs
--
-- Security definer RPCs and the service role are unaffected by both.

alter table if exists public.licenses enable row level security;
drop policy if exists own_clinic_license on public.licenses;
create policy own_clinic_license on public.licenses
  for select
  using (
    exists (
      select 1
      from public.clinics c
      where c.license_id = licenses.id
        and c.id = public.current_clinic_id()
    )
  );

revoke select on public.licenses from anon, authenticated;
grant select (id, revoked, expires_at) on public.licenses to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. clinic_activation_links - deny direct access entirely.
-- ---------------------------------------------------------------------------
-- Holds invite emails and token_hash values. It has no clinic_id (it predates
-- the clinic it creates), so the loop above does not reach it. Every legitimate
-- reader is either the activate-clinic edge function on the service role or
-- rpc_get_activation_link_status, which is security definer - so RLS enabled
-- with no policy is exactly right: closed to anon/authenticated, open to both
-- real callers.

alter table if exists public.clinic_activation_links enable row level security;
drop policy if exists tenant_isolation on public.clinic_activation_links;

-- ---------------------------------------------------------------------------
-- 5. Report anything still unprotected, so the punch list is explicit.
-- ---------------------------------------------------------------------------
-- Expected to remain open: genuinely global catalogs (medication_catalog,
-- doctor_specialities). Anything else in this output is a table whose tenant
-- key is not named clinic_id - it reaches its clinic through a parent row and
-- needs a policy written by hand, in the style of the payments/prescriptions
-- examples in the 2026_08_26 migration.

do $$
declare
  r record;
  v_open text[] := '{}';
begin
  for r in
    select c.relname as table_name
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'r'
      and c.relrowsecurity = false
    order by c.relname
  loop
    v_open := array_append(v_open, r.table_name);
  end loop;

  if array_length(v_open, 1) is null then
    raise notice 'every public table has row level security enabled';
  else
    raise notice 'still without RLS (review each): %', array_to_string(v_open, ', ');
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Verification - run after applying, and keep the output with the migration.
-- ---------------------------------------------------------------------------
--   select c.relname,
--          c.relrowsecurity as rls_enabled,
--          (select count(*) from pg_policy p where p.polrelid = c.oid) as policies
--   from pg_class c
--   join pg_namespace n on n.oid = c.relnamespace
--   where n.nspname = 'public' and c.relkind = 'r'
--   order by c.relrowsecurity, c.relname;
--
-- Rollback for a single table, if a policy turns out to block a real read:
--   alter table public.<table> disable row level security;
