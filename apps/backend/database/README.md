# Database migrations

SQL applied to the Supabase project, ordered by the date prefix in the filename.

## Status of these files

The ten `2026_06_*` / `2026_08_*` files were **recovered from git history** (commit
`cd2a507`, deleted in `b02c93d`). They are the change history, not a verified
snapshot: the live database has drifted from them, and at least two tables they
reference were later renamed.

There is currently **no baseline dump** of the live schema in this repo. Until
there is, treat these files as "what we believe was applied", not "what is
running".

## Producing a real baseline

Once `.env` has Supabase credentials (see `.env.example`):

```bash
# schema only, no data - safe to commit
npx supabase db dump --db-url "$DATABASE_URL" --schema public -f 2026_XX_XX_baseline.sql
```

Commit the result as the first file in the ordering and treat every later
migration as building on it.

## Applying a migration

These are applied by hand through the Supabase SQL editor (or `psql`), since the
project is not linked to the Supabase CLI.

Wrap DDL in a transaction so a bad policy can be rolled back before it reaches
live traffic — Postgres DDL is transactional:

```sql
begin;
-- paste the migration
-- read the NOTICE output before deciding
commit;   -- or: rollback;
```

## Conventions

- One concern per file; date-prefixed, never renumbered after being applied.
- A header comment explaining *why*, not just what — several of these files are
  the only record of a decision.
- Guard statements with `if exists` / `to_regclass(...)` so a partially-applied
  environment does not hard-fail. **Note the trade-off:** that guard is why the
  two mistargeted policies in `2026_08_26_enable_rls_tenant_tables.sql`
  silently no-opped. When a guard is protecting against absence, emit a
  `raise notice` on the skip path so it is visible in the output.
- Prefer catalog-driven loops over hand-maintained table lists for anything that
  must stay in step with the schema (see `2026_09_06_complete_rls_coverage.sql`).

## Verifying tenant isolation

After any change touching RLS:

```sql
select c.relname,
       c.relrowsecurity as rls_enabled,
       (select count(*) from pg_policy p where p.polrelid = c.oid) as policies
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
order by c.relrowsecurity, c.relname;
```

Every table with a `clinic_id` should report `rls_enabled = true` with at least
one policy. Expected exceptions are the global catalogs (`medication_catalog`,
`doctor_specialities`).
