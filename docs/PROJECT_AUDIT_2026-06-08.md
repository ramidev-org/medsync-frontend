# MedSync Web Desktop Audit

Date: 2026-06-08

Scope: frontend routes, dialogs, shared components, client-side data layer, Supabase/RPC integration, and production-readiness gaps for a web desktop medical clinic management SaaS.

Method:
- Reviewed the app route tree and shared components.
- Sampled and inspected the major page files, consultation tabs, settings screens, dashboards, workspace screens, dialogs, and service/context layers.
- Searched for prototype markers, placeholder actions, RPC usage, migration references, and missing workflow signals.
- Ran `npx tsc --noEmit` to confirm current TypeScript compile health.

Current compile status:
- TypeScript compile check passed.

## Executive Summary

The project has a real product core, not just a design prototype. The strongest areas are authentication onboarding, patient creation, visits scheduling, service management, inventory, chats, and the basic consultation open/save/close flow. These areas already use Supabase RPCs or table queries and can support real data.

The biggest issue is uneven product maturity. A meaningful part of the app is production-like, while another large part is still prototype UI with local state, static arrays, placeholder alerts, or read-only info cards. That gap is especially visible in consultation sub-tabs, dashboards, reports/statistics, tasks, notifications, team invites, and most specialty workspace screens.

For a medical SaaS, the most important missing layers are auditability, role enforcement depth, consistent persistence, production document flows, real notifications/reporting, and stronger clinical data integrity patterns.

## Overall Maturity Map

More production-ready:
- `app/activate-clinic.tsx`
- `app/accept-invite.tsx`
- `app/(drawer)/patients.tsx`
- `components/new_patient.tsx`
- `app/(drawer)/visits.tsx`
- `app/(drawer)/consultations.tsx`
- `app/(drawer)/consultation/index.tsx`
- `app/(drawer)/services.tsx`
- `app/(drawer)/inventory.tsx`
- `app/(drawer)/profile.tsx`
- `app/(drawer)/chats.tsx`
- `app/(drawer)/chats/[id].tsx`

Partially implemented:
- `app/(drawer)/calendar.tsx`
- `app/(drawer)/patient_medical_info.tsx`
- `app/(drawer)/dashboard/_doctor.tsx`
- `app/(drawer)/dashboard/_clinic_admin.tsx`
- `app/(drawer)/payments.tsx`
- `app/(drawer)/consultation/_tabs/_consultation_charts.tsx`

Prototype or mostly placeholder:
- `app/login.tsx`
- `app/signup.tsx`
- `app/(drawer)/dashboard/_reception.tsx`
- `app/(drawer)/tasks.tsx`
- `contexts/tasks_context.tsx`
- `app/(drawer)/notifications.tsx`
- `app/(drawer)/reports.tsx`
- `app/(drawer)/statistiques.tsx`
- `app/(drawer)/users.tsx`
- `app/(drawer)/settings-*.tsx` except profile data display
- `app/(drawer)/consultation/_tabs/_lettres.tsx`
- `app/(drawer)/consultation/_tabs/_maladies.tsx`
- `app/(drawer)/consultation/_tabs/_symptomes.tsx`
- `app/(drawer)/consultation/_tabs/_documents.tsx`
- most specialty workspace wrappers and interactive workspace components

## Highest Priority Fixes

P0:
- Finish persistence and real backend flows for consultation tabs that still save only locally or show prototype alerts.
- Add medical audit logging for consultation edits, treatment changes, diagnosis/document actions, and profile-sensitive updates.
- Remove stale migration references and align deployment instructions with actual SQL files in `database/sql`.
- Replace placeholder authentication/account flows such as dead forgot-password and placeholder Google auth config.
- Eliminate prototype-only business pages from production navigation or finish them before launch.

P1:
- Break large clinical screens into smaller modules, especially observation and visits.
- Replace static/mock dashboard, reports, notifications, tasks, and statistics data with real queries.
- Add real staff invite flow in team management.
- Normalize encoding and localization issues across French strings.
- Strengthen role-based navigation and action-level authorization.

P2:
- Improve UX consistency, table pagination, filters, empty states, and printing/export workflows.
- Add tests for critical RPC-backed flows.
- Add analytics/monitoring for failed RPCs and edge-function onboarding.

## Architecture Review

Strengths:
- The app uses a consistent Supabase-backed pattern with `callRpc` in `services/backend.ts`.
- The consultation domain already has typed backend entities in `services/backend.types.ts`.
- Inventory and chat features are split into service files, which is a good direction.
- `AuthProvider`, `AppDataProvider`, and route-level shell composition are clear enough to extend.

Weaknesses:
- Data access strategy is mixed. Some pages use RPCs, some query tables directly from the client, and some are fully local-only.
- The RPC name union in `services/backend.ts` is manually maintained and will drift as backend capability grows.
- Too much product logic lives in giant route components instead of reusable feature modules.
- Several critical flows still use client-only control logic where server-side enforcement should be the real source of truth.
- There is no visible frontend evidence of a consistent audit/event subsystem being used, even though `ConsultationEventRow` exists in types.

## Frontend Page-By-Page Audit

### Entry and Auth

`app/index.tsx`
- Simple entry behavior is fine, but the app still depends heavily on client-side auth resolution for routing.

`app/login.tsx`
- Visual page exists, but the flow is incomplete for production.
- `Forgot password?` is present but not wired to any reset flow.
- The page is styled separately from the main app design system and feels disconnected from the drawer app.
- Several strings show encoding issues.
- Needs stronger validation, disabled states, clearer error handling, and accessibility polish.

`app/signup.tsx`
- This is not a real signup page. It behaves more like a chooser/redirector to activation or invite acceptance.
- Route naming is misleading and will confuse future maintainers and users.

`app/activate-clinic.tsx`
- One of the stronger flows in the codebase.
- Uses token validation and edge-function submission.
- Still needs stronger password policy UX, explicit success/failure telemetry, and clearer recovery when tokens are invalid/expired.

`app/accept-invite.tsx`
- Similar to activation: structurally good, but needs better validation and better handling for retry, expired links, and already-used links.

### App Shell and Navigation

`app/_layout.tsx`
- Uses web-only DOM elements like `div` in the loading shell. That is workable for desktop web, but it weakens cross-platform cleanliness.
- Route guards are frontend-led; sensitive actions still need backend enforcement.

`app/(drawer)/_layout.tsx`
- Navigation structure is large and useful.
- Some pages in navigation are not production-ready enough yet.
- Role filtering is shallow. Team visibility is gated, but many other capabilities appear to rely mostly on UI assumptions.
- English/French language mixing is visible.

### Dashboards

`app/(drawer)/dashboard/index.tsx`
- Role switching is straightforward.
- Admin landing should be more explicit and consistent with actual user role expectations.

`app/(drawer)/dashboard/_doctor.tsx`
- Counts are real, but chart content is still hardcoded/mock.
- Hover/detail interactions are web-centric and not tied to live backend data.
- Good structure for future real analytics, but not trustworthy yet as a clinical/operational dashboard.

`app/(drawer)/dashboard/_clinic_admin.tsx`
- Stronger than most admin pages.
- Uses real RPCs for counts, staff, and virtual clinics.
- Still mixes direct table queries with RPCs, which creates data access inconsistency.
- Worth keeping as the foundation for the admin area.

`app/(drawer)/dashboard/_reception.tsx`
- Still largely concept-stage.
- The file itself contains a TODO about replacing fake data.
- Agenda/work queue content is effectively placeholder.
- Should not be considered production-ready for reception operations yet.

### Scheduling, Patients, Visits

`app/(drawer)/calendar.tsx`
- Uses real appointments data, which is good.
- The lane/room layout is artificial: appointments are distributed into rooms by array index, not by actual room/resource assignment.
- It works visually but does not represent real scheduling semantics.
- Good candidate for a read-only schedule board after backend room/resource modeling is added.

`app/(drawer)/patients.tsx`
- Solid basic list page.
- Real RPC-backed loading.
- Main gaps are edit/archive/delete workflows, pagination depth, and more robust filters.

`components/new_patient.tsx`
- One of the better modal flows.
- Real validation and real RPC-backed patient creation.
- Good multi-tab form concept.
- Still needs stronger date validation, duplicate handling polish, and probably smaller subcomponents because the modal is large.

`app/(drawer)/visits.tsx`
- This is an important and relatively mature page.
- Real appointment CRUD exists.
- It is also a very large monolithic file with multiple modals and a lot of local form state.
- Risk areas are maintainability, accidental regression, and difficulty adding richer business rules.
- Should be decomposed into form, filters, table, action menu, and modal modules.

`app/(drawer)/consultations.tsx`
- Real list page and reasonably useful.
- Main problem is deployment drift: the file tells the user to apply `database/sql/2026_04_29_full_upgrade.sql`, but that SQL file is not present locally.
- This creates avoidable confusion during setup and support.

`app/(drawer)/patient_medical_info.tsx`
- Real patient medical fetch path exists.
- Good clinical density for reading.
- Missing stronger edit/update flows, clearer event history, and likely a complete print/export implementation.

### Consultation Workspace

`app/(drawer)/consultation/index.tsx`
- The core consultation lifecycle is real: appointment details load, consultation opens, saves, and closes through RPCs.
- This is a strong base.
- But the page still has placeholder actions:
- `onLastVisit` shows a prototype alert.
- `onClose` shows a prototype alert for header behavior even though close RPC exists elsewhere.
- Printing/prescription handling is incomplete.
- The page is large and should be split by header, sticky navigation, save orchestration, and tab coordination.

`app/(drawer)/consultation/_tabs/_observation.tsx`
- This is the heaviest frontend file in the project and a major refactor target.
- It is nearly 2,000 lines and contains many modal/local-state branches.
- The file itself contains prototype comments and placeholder sections.
- It has real clinical ambition, but maintainability is poor and backend completeness is uneven.
- This screen should be split into vitals, summary, history, specialty fields, charts summary, and specialty widgets.

`app/(drawer)/consultation/_tabs/_treatment.tsx`
- UX direction is better now because editing is inline instead of modal-heavy.
- Main remaining question is persistence depth. The treatment screen should save into the consultation domain consistently and emit audit events.
- Needs explicit support for medication line items, durations, status, and history.

`app/(drawer)/consultation/_tabs/_consultation_charts.tsx`
- Better than the pure mock statistics page because it uses consultation data.
- Good direction after filtering to important clinical fields.
- Still needs production chart interactions, units normalization, and specialty-aware data definitions.

`app/(drawer)/consultation/_tabs/_ordonnances.tsx`
- Needs tighter linkage with actual prescription items, printable output, signature/status handling, and document storage.

`app/(drawer)/consultation/_tabs/_lettres.tsx`
- Still prototype-level.
- Save and PDF generation currently show prototype alerts.
- Not ready for real referral/summary letter workflows.

`app/(drawer)/consultation/_tabs/_maladies.tsx`
- Prototype save action only.
- Needs real diagnosis persistence, coding support, history, and case linkage.

`app/(drawer)/consultation/_tabs/_symptomes.tsx`
- Prototype save action only.
- Needs structured symptom capture or at least persisted text data with timestamps and authoring.

`app/(drawer)/consultation/_tabs/_documents.tsx`
- “View” action is still prototype-only.
- Document handling is not complete enough for a medical app.
- Needs upload, preview, permission checks, attachment metadata, and audit trail.

### Business, Admin, and Staff

`app/(drawer)/services.tsx`
- Good RPC-backed CRUD base.
- Modal management is acceptable.
- Main issue is stale migration guidance referencing `database/sql/2026_04_30_yolo_web_phase1.sql`, which is not present locally.

`app/(drawer)/inventory.tsx`
- One of the healthiest admin/ops pages.
- Real service layer and meaningful adjustment flow exist.
- Still needs richer stock history, supplier/vendor support, costing, and expiration tracking if the product will handle medication/medical supplies seriously.

`app/(drawer)/payments.tsx`
- Data is real enough to list rows from the `payments` table, but the page is still thin for a SaaS billing/clinic cashier workflow.
- No visible create payment, refund, reconciliation, invoice linking UX, or outstanding balance workflow.
- Status rendering is also fragile because localized display values and raw status values are mixed.

`app/(drawer)/reports.tsx`
- Fully static.
- Should be treated as placeholder until real metrics and export flows exist.

`app/(drawer)/statistiques.tsx`
- Entirely mock medical charts.
- It now behaves better interactively, but the data is still fake.
- It should not sit beside real clinical pages without a “demo/prototype” label unless backend analytics are added.

`app/(drawer)/users.tsx`
- Staff listing is real.
- Invite action is not implemented and is labeled `Invite (UI ready)`.
- This is not enough for a clinic admin team-management page.
- Needs invite creation, resend, deactivate/reactivate, and role/seat-limit handling.

`app/(drawer)/settings.tsx`
- Good hub page shape.
- Mostly a navigation surface rather than a real settings implementation.

`app/(drawer)/settings-practice.tsx`
- Read-only information display.
- No actual practice editing workflow from this page.

`app/(drawer)/settings-subscription.tsx`
- Useful readout of current plan/limits.
- Still informational only.
- Payment/renewal workflow is descriptive text, not a real management feature.

`app/(drawer)/settings-security.tsx`
- Pure checklist content.
- No real security controls.

`app/(drawer)/settings-data.tsx`
- Pure informational cards.
- No export, backup trigger, retention, or restore flow yet.

`app/(drawer)/profile.tsx`
- Better than the settings pages because it has real update capability.
- However, the `Change Password` and `Remove account` actions are UI-only and not wired.
- This page is a good base, but the account tab is incomplete.

`app/(drawer)/notifications.tsx`
- Entirely mock notifications with local state.
- Not connected to any event, billing, clinical, or messaging backend.

`app/(drawer)/tasks.tsx`
- Fully local state via `TasksContext`.
- No backend persistence, assignment model, or clinic-wide task ownership.
- Useful as a UI concept only.

`contexts/tasks_context.tsx`
- Confirms tasks are prototype-only and in-memory.

`app/(drawer)/chats.tsx`
- Good routing/bootstrap approach for direct chat discovery.
- Depends on clinic staff and conversation RPCs.
- Reasonable entry logic.

`app/(drawer)/chats/[id].tsx`
- One of the better real-time style UX pieces.
- Real message load/send pattern exists.
- Still needs delivery/read state, retry, pagination/load older, and attachment support.

### Specialty Workspace Pages

Wrapper pages:
- `general-medicine-workspace.tsx`
- `cardiology-workspace.tsx`
- `endocrinology-diabetes-workspace.tsx`
- `gastroenterology-workspace.tsx`
- `gynecology-workspace.tsx`
- `ophthalmology-workspace.tsx`
- `ent-workspace.tsx`
- `pulmonology-workspace.tsx`
- `pediatrics-workspace.tsx`
- `orthopedics-workspace.tsx`

Assessment:
- Most of these are thin wrappers around shared workspace components rather than fully distinct backend-backed modules.
- They are useful for IA and specialty positioning, but not yet full product surfaces.

`components/workspaces/GenericMedicalWorkspacePage.tsx`
- Strong concept, weak backend depth.
- Heavy local state and mock history patterns.
- Needs shared persistence models if it will stay in the product.

`components/workspaces/SpecialtyInteractiveWorkspace.tsx`
- Mostly exploratory UI.
- Not a production workflow yet.

`components/LabWorkspaceScreen.tsx`
- Clearly prototype-heavy with static test requests, previews, and history.
- Needs true lab order/result backend modeling before production use.

`components/workspaces/dentistry-workspace.tsx`
- Appears more bespoke than the generic wrappers, but still modal/prototype-heavy.
- Needs clear persistence and treatment-case modeling.

`components/workspaces/dermatology-workspace.tsx`
- Similar issue: visually richer than a placeholder, but not yet clearly product-complete.

## Dialog and Modal Audit

Observations:
- The app relies heavily on modals for complex workflows.
- `app/(drawer)/consultation/_tabs/_observation.tsx` is the most modal-heavy screen.
- `app/(drawer)/visits.tsx`, `components/new_patient.tsx`, `app/(drawer)/inventory.tsx`, and `app/(drawer)/services.tsx` also rely on dialogs significantly.

What is working:
- `components/new_patient.tsx` uses modal UX in a way that still maps to a real workflow.
- Inventory and services modals are acceptable for CRUD.

What needs improvement:
- Clinical editing should prefer inline panels or side sheets for long-form work rather than deeply nested modal behavior.
- Several dialogs are placeholders or simply alert-driven prototypes.
- Modal count is increasing because components are carrying too many responsibilities.

Recommendation:
- Keep small CRUD modals for inventory/services.
- Move clinical authoring and treatment/observation editing to inline panels.
- Convert prototype alert actions into real workflows or hide them until finished.

## Backend and Data Layer Audit

What is good:
- RPC-driven design is the right direction for a multi-tenant clinic SaaS.
- Consultation, visits, staff, services, chats, and inventory already follow this pattern in meaningful parts of the app.
- `services/backend.types.ts` gives a strong start for type-safe domains.

Main gaps:
- Some features still read tables directly from the client instead of going through RPC/service boundaries.
- `payments.services.ts` queries `payments` directly from the browser/client layer.
- `contexts/appData_context.tsx` directly loads clinic and subscription-related tables from the client.
- Direct client reads may be okay with strict RLS, but they create a less consistent service boundary.

Migration drift:
- `app/(drawer)/consultations.tsx` references `database/sql/2026_04_29_full_upgrade.sql`, but that file is not present.
- `app/(drawer)/services.tsx` references `database/sql/2026_04_30_yolo_web_phase1.sql`, but that file is not present.
- Local SQL inventory shows only:
- `database/sql/2026_05_06_inventory_and_missing_rpcs.sql`
- `database/sql/2026_05_09_inventory_and_chats.sql`

Clinical risk gaps:
- I did not find frontend evidence of a full audit log workflow being surfaced for high-risk medical edits.
- Document, diagnosis, symptom, and letters flows are not yet consistently persisted.
- There is no visible end-to-end prescription lifecycle with sign/finalize/print/archive.
- File/document handling is not mature enough for regulated medical records.

Operational gaps:
- No visible automated test coverage for critical flows.
- No visible retry/telemetry strategy around failed RPCs beyond alerts.
- No visible background job/notification system surfaced in the product.

## Security and Compliance Concerns

Important for a medical SaaS:
- Replace placeholder Google auth config in `contexts/auth_context.tsx`.
- Finish password reset/change flows before production rollout.
- Add stronger role enforcement for clinical, billing, inventory, and team actions.
- Add visible audit/event history for medical record changes.
- Add proper document access controls and storage strategy.
- Review PHI exposure in client-side data fetching paths.
- Ensure RLS policies fully enforce clinic isolation and role access because several pages assume the frontend is enough.

## Quality Issues Seen Repeatedly

Encoding/localization:
- There are many mojibake/encoding issues like `Aujourdâ€™hui`, `RÃ©sultat`, `PrÃ©nom`, `AnnulÃ©`, and similar.
- This appears across notifications, payments, users, reception dashboard, and some consultation areas.

Design-system consistency:
- Auth screens feel visually separate from the main app.
- Some screens are fully themed while others still use hardcoded colors and styles.

Maintainability:
- Several files are too large and carry UI, state, validation, and service orchestration in one place.
- Biggest refactor targets are consultation observation, consultation page, and visits.

Testing:
- I did not find test files in the repository.
- The project needs at least smoke coverage for auth, patient creation, appointment creation, consultation save/close, services CRUD, and inventory adjustment.

## What Is Missing Before Serious Production Launch

Missing product capabilities:
- Real staff invite and seat management flow
- Real notifications/events system
- Real tasks backend
- Real reports and analytics
- Complete prescription/document pipeline
- Diagnosis/symptom persistence
- Lab workflow persistence
- Export/backup/restore controls
- Payment creation and reconciliation workflows
- Full clinic settings edit flows
- Password reset/change/account deletion flows
- Room/resource-aware scheduling
- Medical audit history surface

Missing engineering capabilities:
- Test coverage
- Error telemetry and observability
- Better separation between page UI and domain logic
- Migration documentation cleanup
- Stronger localization cleanup

## Recommended Roadmap

Phase 1:
- Finish consultation tabs so every visible tab either persists real data or is removed from production nav.
- Fix stale migration references and align setup docs with actual SQL files.
- Complete auth/account essentials: forgot password, change password, remove account handling, real Google config.
- Add audit trail for consultation save/close, treatment changes, diagnosis changes, and document actions.

Phase 2:
- Replace mock dashboards, statistics, reports, notifications, and tasks with real backend data or mark them clearly as beta/internal.
- Build real team invite lifecycle on `users.tsx`.
- Add payment creation, invoice linkage, and cashier actions.
- Refactor visits and observation into smaller modules.

Phase 3:
- Upgrade specialty workspaces from wrappers/prototypes into true specialty products or remove them from main navigation until ready.
- Add exports, backups, reporting, and compliance/admin controls.
- Add automated tests and release-health monitoring.

## Bottom Line

This codebase is not an empty shell. It already contains a usable clinical operations backbone around patients, visits, consultations, inventory, services, onboarding, and chats.

The biggest product risk is that the UI currently presents prototype and production areas side-by-side with very similar visual confidence. For a clinic SaaS, that is more dangerous than having fewer screens, because users may trust workflows that do not yet persist, audit, or enforce rules strongly enough.

My recommendation is to narrow the production scope for launch:
- Keep patients, visits, consultation core, services, inventory, onboarding, and chat as the first serious product slice.
- Treat reports, notifications, tasks, statistics, incomplete consultation tabs, and most specialty workspace pages as beta/internal until their backend and audit story are real.
