# Project audit (2026-04-19)

This repo is an Expo Router “universal” app (native + web) with Supabase as backend and a `demo` mode that bypasses Supabase.

## Roles (doctor vs clinic admin)

Current model is already the right direction:

- **User role**: `doctor` or `reception` (via `user_roles.role`).
- **Clinic admin**: **not** a separate role; it’s a permission on a doctor, derived from `clinics.admin_id === profiles.id`.

Recommendation: keep “admin” as a **capability flag** (`isClinicAdmin`) and avoid adding an `"admin"` role back into `user_roles`. This matches how most clinic apps implement RBAC (role + scoped permissions).

## Key fixes already applied in-code

- **Typed routes / navigation stability**: fixed `router.push` calls that were failing `tsc --noEmit` with `typedRoutes` enabled.
- **Patients page correctness + perf**: demo mock loading no longer overwrites real-mode data; removed noisy console logs; memoized fetch function to prevent stale closures.
- **AppDataProvider stability**: now reacts to user/clinic changes and avoids setting state after unmount.
- **DX**: added `npm run typecheck`; restored missing `scripts/reset-project.js`.
- **Data labels**: corrected mojibake strings in a few UI/seed/demo datasets (e.g., “Réception”, “Comprimé”).

## Remaining recommendations (highest impact first)

### 1) Security & tenancy (must-have before production)

- **Never call admin APIs from the client**: any operation that needs elevated rights must go through **Supabase Edge Functions** (or server) using a service role key.
- **RLS for multi-clinic**: enforce `clinic_id` scoping for *every* table and query; verify there is no cross-clinic read/write path.
- **Audit logging**: keep an append-only audit trail for user management, billing, and record access.

### 2) Performance

- **Virtualize large lists**: prefer `FlatList` over `ScrollView` for patients/users/visits when the dataset grows.
- **Reduce re-render churn**: move heavy `StyleSheet.create(...)` calls outside render or memoize style factories where possible (especially for “card grid” screens).
- **Charts**: consider lazy-loading chart modules and rendering skeletons; charts are often the #1 CPU hotspot on web.

### 3) Product polish (what “popular clinic apps” typically nail)

- **Consistent information architecture**: “Today” queue for reception, “Agenda + Consultations” for doctors, “Users/Clinics/Billing” for clinic admin.
- **Search everywhere**: global patient search in header, keyboard-first flows, and fast filtering.
- **Empty/loading/error states**: consistent skeletons, retry actions, and offline-friendly messaging.
- **Internationalization**: unify FR/EN copy and remove mixed-language UI.

### 4) Workflow / quality gates

- Add CI checks: `npm ci`, `npm run lint`, `npm run typecheck`, and a web export build (`npm run export:web`).
- Add a small runtime smoke-check page in demo mode to validate navigation + providers.
