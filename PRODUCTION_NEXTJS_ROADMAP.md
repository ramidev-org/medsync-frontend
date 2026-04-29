# Production Roadmap (Expo -> Next.js)

This project currently runs on Expo Router (React Native + web export). To reach the target production stack, migrate in phases.

## Target stack

- Frontend: Next.js + React + TypeScript
- UI: Tailwind CSS + shadcn/ui
- Forms: React Hook Form + Zod
- Data: Supabase
- Backend: Next.js Server Actions/API routes (upgrade to NestJS only if domain grows large)

## Phase 1: Stabilize current app

- Keep Supabase auth + RLS as source of truth.
- Move specialty logic to shared domain types/functions.
- Keep feature parity in consultation tabs (observation, diagnostics, prescriptions, documents).
- Add CI gates: `lint`, `typecheck`, `web build`.

## Phase 2: Shared domain package

Create a shared package (`packages/domain`) used by both Expo and Next.js:

- `speciality` enum + normalization
- consultation schemas with Zod
- API payload types
- role/permission guards

This avoids rewriting business logic twice.

## Phase 3: Next.js app bootstrap

Create `apps/web` with:

- Next.js App Router + TypeScript
- Tailwind + shadcn/ui
- React Hook Form + Zod
- Supabase server/client split

Recommended folders:

- `apps/web/app/(dashboard)/consultation/[id]/page.tsx`
- `apps/web/components/consultation/*`
- `apps/web/lib/supabase/*`
- `packages/domain/*`

## Phase 4: 3D specialty workspace

For web-only 3D clinical rendering:

- Use `three`, `@react-three/fiber`, `@react-three/drei`
- Add one viewer per specialty module (dentistry first)
- Use tool overlays per specialty (tooth selector, lesion markers, treatment annotation)

Dentistry module baseline:

- Upper/lower arch scene
- Tooth click/pick state
- Status tools: healthy, cavity, treated, missing
- Save annotation JSON to Supabase (`consultation_speciality_payload`)

## Phase 5: Backend boundaries

Use Next.js Server Actions/API routes while scope is moderate:

- consultation write/update
- file/document upload
- audit log events

Adopt NestJS only when you need:

- heavy background workflows
- many bounded contexts
- complex multi-service orchestration

## Phase 6: Go-live checklist

- Enforce RLS and clinic-level tenancy tests
- Add structured logs + error tracking
- Add synthetic monitoring for consultation flow
- Load/perf test read/write critical paths
- Add backup and restore process for Supabase
