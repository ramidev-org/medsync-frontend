# Project audit (2026-04-19)

This repo is an Expo Router “universal” app (native + web) with Supabase as backend and a `demo` mode that bypasses Supabase.

## User types (doctor vs assistant) + clinic admin

- **User type**: `doctor` or `assistant` (via `users_metadata.user_type`).
- **Clinic admin**: inferred from `clinics.admin_id` (doctors only).

## Security notes (must-have before production)

- Never call `auth.admin.*` from the client. Any admin user creation / invite acceptance must be server-side (Edge Functions).
- Keep RLS strict for multi-clinic tenancy on all tables and RPCs.

## Workflow / quality gates

- CI should run: `npm ci`, `npm run lint`, `npm run typecheck`, and `npm run export:web`.
