1. What you actually have
It's not a frontend-only app — you already have a backend, it's just not in this repo:

Tier	Where it lives	In git?
UI (web + Electron desktop + RN)	app/, components/ — 33k lines	✅
Business logic	~60 Postgres SECURITY DEFINER RPCs	❌ mostly not
Auth/onboarding	3 Supabase Edge Functions (activate-clinic, create-staff-invite, accept-staff-invite)	❌ not at all
Calling/ICE	api/call-config.ts (Vercel) + scripts/start-calling-server.cjs	✅
services/backend.ts lists 59 RPC names. database/ contains 8 SQL files. Your schema dump shows ~35+ tables. Most of your backend exists only inside the Supabase dashboard. That's the single biggest structural problem — see §6.

2. Critical — fix before another clinic signs up
a) .env is committed to git.


git ls-files .env  →  .env   (since commit e80c52c)
It's in .gitignore but was tracked before that, so the ignore does nothing. Your Supabase URL + anon key are in history. Anon key isn't a secret per se, but git rm --cached .env now, and never let a service-role key land there.

b) Every secured RPC has a client-side fallback that bypasses it.

services/patients.services.ts:33:


return message.includes('RPC "rpc_get_patients" was not found')
    || message.includes("rpc_get_patients");   // ← matches almost any error
On failure it falls through to a raw db.from("patients").eq("clinic_id", params.clinicId) — with clinicId supplied by the client. Same pattern in payments, lab, tasks, and visits.tsx:344-465 (create/update/cancel appointments direct to table).

Your RPCs are actually well-written — rpc_get_patients checks auth.uid() = p_requester_id and derives clinic_id server-side. Then the fallback throws all of that away. Delete every fallback. If an RPC is missing, that's a deploy bug, not a runtime branch.

c) I found no RLS anywhere in the repo. Zero enable row level security, and the only create policy statements are for the chat-documents storage bucket. Combined with (b), if RLS is off on patients, any authenticated user from clinic A can read clinic B's patients. Please verify:


select relname, relrowsecurity from pg_class c
join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relkind='r' order by 2,1;
If any tenant table shows false, that's a live cross-tenant leak.

d) Role and clinic-admin come from the URL. config/runtime.ts reads ?role=doctor&clinic_admin=true and persists it to sessionStorage. It's currently only used as a fallback when user.user_type is missing (_layout.tsx:48), so it's not a live escalation — but it's a loaded gun in production code. Ship it behind __DEV__ or delete it.

e) License/subscription is enforced in the browser. appData_context.tsx reads licenses.revoked/expires_at client-side and the route guard redirects. Anyone can bypass it with devtools. Subscription state must gate the RPCs, not the router. Also DEV_SUBSCRIPTION_BYPASS = __DEV__ appears in both the context and _layout.tsx:30 — make sure that can't survive a misconfigured build.

f) The migration that "secures" your RPCs rewrites them by regex. 2026_08_10_secure_privileged_rpcs.sql does pg_get_functiondef() → regexp_replace on the word begin → execute. It's clever, and it works once, but it proves the repo isn't the source of truth, it silently no-ops if a function was renamed, and it will corrupt any function whose body contains begin inside a nested block before the intended one.

3. Database
Tenancy

clinic_id is nullable on patients, appointments, prescriptions, financial_transactions, users_metadata. For a multi-tenant medical SaaS the tenant key must be NOT NULL on every tenant table. A null slips past every = v_clinic_id filter and every RLS policy.
clinic_id is missing entirely on prescription_lines, consultation_diagnoses, patient_medical_info, patient_measurements, conversation_reads, clinic_conversation_members. Every policy on those needs a join — slow and easy to get wrong. Denormalize clinic_id onto them and add a composite FK (id, clinic_id) so a row can't be attached across tenants.
Enums declared but not used — you defined prescription_status_enum, but prescriptions.status is text default 'draft'. Same for consultation_diagnoses.status, clinic_conversations.kind, consultation_documents.kind/document_type, financial_transactions.transaction_type. Free text where an enum exists means invalid states will accumulate.

Denormalized values with no trigger keeping them true

patients.age alongside date_of_birth — stale the day after insert. (Your RPC correctly computes it from DOB, so the column is dead weight actively lying to anyone who queries the table.) Drop it, or make it generated.
patient_measurements.bmi — derive from weight/height.
clinic_inventory_items.qty_on_hand vs clinic_inventory_movements.delta — these will drift. Maintain via trigger inside the same transaction, or make the movements table the sole truth.
Missing constraints

No visible unique key on patients(clinic_id, code), (clinic_id, medical_record_number), or (clinic_id, national_id). Duplicate patient records are the #1 data-quality killer in clinic software.
appointments has scheduled_at but no duration/end time → you cannot detect or prevent double-booking. Add ends_at and a btree_gist exclusion constraint on (doctor_id, tstzrange(scheduled_at, ends_at)).
No doctor_availability / working-hours / holidays table at all, so the calendar can't validate anything.
patients.place_of_birth, age, marital_status are NOT NULL — too strict for reception intake with a walk-in. marital_status_enum also lacks widowed.
Missing for a medical product

No audit trail. Nothing records who read or modified a patient record. This is a hard requirement in essentially every health-data regime, and it's also your only defence in a dispute. Add an append-only audit_log(clinic_id, actor_id, action, table_name, row_id, diff jsonb, at) written by trigger.
No soft delete (deleted_at) — medical records generally must not be hard-deleted.
Three overlapping money models: financial_transactions, payments, and invoices/services/expenses RPCs. Pick one ledger. No currency column anywhere — fine while you're DZD-only, painful later.
No SaaS billing tables. clinics.tier_plan is free text and licenses.payload is a blob. There's no plan definition, no seat entitlement, no billing history. max_doctors/max_assistants sit on clinics with no enforcement I can find in the invite path.
No roles/permissions table. user_type_enum is only doctor | assistant; clinic-admin is inferred from clinics.admin_id plus a "if there's exactly one doctor, they're the admin" heuristic in appData_context.tsx:97. You'll want roles + permissions before your first customer asks "can my receptionist see revenue?".
updated_at columns default to now() but nothing updates them — no moddatetime triggers.
consultation_documents.url stores a URL. Store a bucket path and sign on read; a stale public URL to a patient's imaging is a breach.
4. Frontend
Localization is built and completely unused. localization/ has en.ts, fr.ts, ar.ts and a provider — and 0 of 94 .tsx files import useLocalization. Every string is hardcoded French. For a product targeting Algeria (appId: dz.medsync.desktop) that means no Arabic, and no RTL layout work has been done at all. This gets exponentially more expensive the longer you wait — 33k lines already.

No data layer. Every screen does useEffect + useState + manual loading/error. No caching, no dedup, no invalidation, so navigating away and back refetches everything, and two components showing the same patient hold two copies. @tanstack/react-query would delete a large fraction of that code and fix the staleness bugs.

No error boundary anywhere, and no Sentry/crash reporting. One render error in a consultation = white screen, and you never hear about it.

Files are too big. chats/[id].tsx is 2,485 lines with 11 useEffects (it contains the entire WebRTC signalling stack inline). _observation.tsx is 2,384. LabWorkspaceScreen.tsx is 2,264. These are unreviewable and untestable.

Zero tests, zero CI. No test files, no .github/. For software where a bug means a wrong prescription, that's the gap I'd close first after security.

Design system isn't enforced. theme/colors.ts is good, but there are 286 distinct hardcoded hex values across app/ and components/, with 69 separate StyleSheet.create blocks.

189 as any casts in a strict: true project. Typecheck does pass clean, which is a genuine plus — but you're paying for TS and opting out at every boundary. Generate types from your DB (supabase gen types typescript) and the anys at the Supabase boundary disappear.

Chat polls on a 5s setInterval (chats/[id].tsx:141) while you already use Supabase Realtime channels for presence and call signalling. Use postgres_changes on clinic_messages instead — less load, instant delivery.

Minor: _layout.tsx renders raw <div>/<p> in the loading state, which will crash on iOS/Android despite npm run ios/android being in your scripts.

5. Workflow gaps
Your clinical chain — appointment → consultation → diagnosis → prescription/lab → invoice — is modelled, which is more than most projects at this stage. What's missing:

No state machine. appointment_status_enum has 6 values and consultation_status_enum 3, but nothing prevents completed → pending or a consultation closing with an unsigned prescription. Encode legal transitions in a trigger.
Prescriptions have signed_at/signed_by but signed_by is text — not a user FK, no signature artifact, no immutability after signing. A signed prescription must become read-only.
No patient merge/dedup flow, which you'll need on day one given the missing unique constraints.
No clinic onboarding self-service visible — activation runs through licenses + a manual key. Fine for pilots, a wall at scale.
Offline support is desktop-Electron-only (offline_queue.ts returns early unless isDesktopApp()), and it replays raw RPC calls with no conflict resolution. It also silently drops all but the newest consultation draft. Verify that's the behaviour you want when a doctor works a whole afternoon offline.
No backup/export path for a clinic's own data — usually a contractual requirement.
6. Should you split into frontend/backend folders?
Not the way you're framing it — don't build a Node API tier. Your Postgres-RPC-as-API design is legitimate and you've already invested ~60 functions in it. Adding an Express/Nest layer in front of Supabase would be a large rewrite for little gain.

But yes, restructure — because your backend isn't version-controlled. That's the actual problem hiding behind the question. Right now you cannot recreate your production database from this repo, you can't review a schema change in a PR, and you can't spin up a staging environment.

Move to a Supabase-CLI monorepo:


medsync/
├── apps/
│   ├── app/               # expo-router: app/ components/ theme/ localization/
│   └── desktop/           # electron
├── packages/
│   ├── shared/            # domain models, zod schemas, constants
│   └── db-types/          # generated from the DB — single source of truth
├── supabase/
│   ├── migrations/        # ← every table, enum, index, RLS policy, RPC
│   ├── functions/         # ← the 3 edge functions, currently untracked
│   ├── seed.sql
│   └── config.toml
└── services/
    └── call-api/          # api/call-config.ts + the ICE server
The order that matters:

supabase db pull → dump your entire current schema into supabase/migrations/0000_baseline.sql. Do this today; it's a one-command insurance policy.
Pull the three edge functions into supabase/functions/ before someone edits them in the dashboard and you lose the old version.
From then on: schema changes only via migration files, deployed through supabase db push in CI. No more dashboard edits, no more regex-patching live function bodies.
supabase gen types typescript → kills most of the 189 anys.
Only then is the apps//packages/ split worth doing — it's cosmetic by comparison.
Suggested order
Work	Why
1	git rm --cached .env; audit RLS on every table	Live tenant-isolation risk
2	Delete all client-side RPC fallbacks + direct .from() writes	Bypasses your own auth checks
3	supabase db pull baseline + commit edge functions	You currently cannot rebuild prod
4	clinic_id → NOT NULL everywhere; add missing clinic_id columns; unique patient keys	Data integrity, cheapest now
5	Audit log + soft delete	Compliance; retrofits badly
6	Move license/subscription enforcement server-side	Revenue leak
7	Generated DB types + react-query + error boundary + Sentry	Kills a whole class of bugs
8	Wire up i18n (fr/ar/en + RTL)	Cost grows with every screen
9	Appointment ends_at + overlap constraint + availability table	Scheduling is currently unsafe
10	Tests + CI on the RPCs	Correctness in a clinical product
Two things worth saying plainly: the RPC layer you wrote (auth.uid() check + server-derived clinic_id) is the right pattern, and typecheck passes clean on 37k lines. The problem isn't the design — it's that the client is allowed to route around it, and the design only exists in a dashboard.

Want me to start on any of these? Items 1–3 I could do now; item 4 I'd want to write as a migration for you to review before it touches data.