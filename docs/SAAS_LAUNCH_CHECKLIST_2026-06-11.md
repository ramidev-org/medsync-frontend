# SaaS Launch Checklist

## 1. Deployment blockers

- [ ] Set production env vars for `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
- [ ] Deploy all required Supabase RPCs and edge functions referenced by the app.
- [ ] Confirm `activate-clinic`, `create-staff-invite`, and `accept-staff-invite` are deployed.
- [ ] Confirm static export host rewrites deep links like `/invite/:token`, `/accept-invite`, and `/activate-clinic`.
- [ ] Verify RLS and permissions for every table still queried directly from the frontend.

## 2. Product workflows that are live and should be kept

- [ ] Auth and login flow
- [ ] Clinic activation flow
- [ ] Staff invite flow
- [ ] Team management page
- [ ] Patients
- [ ] Patient medical info
- [ ] Visits / appointments
- [ ] Calendar
- [ ] Consultations
- [ ] Services
- [ ] Inventory
- [ ] Chats

## 3. Workflows that are not launch-ready yet

- [ ] `Tasks` is local-only and not persisted
- [ ] `Reports` is static UI only
- [ ] `Statistiques` is mock charts only
- [ ] `Notifications` is mock-only
- [ ] Consultation `Documents` tab is local-only
- [ ] Consultation `Ordonnance` tab is only partially integrated
- [ ] Reception dashboard still mixes real counts with placeholder sections
- [ ] Lab workspace is fully demo/mock and should not ship as a real feature yet

## 4. Recommended launch actions

- [ ] Hide unfinished screens from the drawer before production launch
- [ ] Keep the shared consultation model as the source of truth:
  - `consultations`
  - `consultation_observations`
  - `consultation_vitals`
  - `consultation_parameters`
  - `consultation_diagnoses`
  - `consultation_documents`
  - `consultation_events`
  - `prescriptions`
- [ ] Standardize reads/writes through RPCs where possible instead of mixed direct table access
- [ ] Add a real role model if you want `admin`, `receptionist`, or `nurse` as distinct stored roles
- [ ] Decide v1 scope clearly:
  - Keep only clinic/team/patient/visit/consultation/service/inventory/chat if you want a smaller SaaS launch

## 5. Database cleanup guidance

### Safe to review for removal now

These look like legacy or unused-by-current-frontend tables for specialty-specific consultation storage:

- `consultation_cardiology`
- `consultation_dermatology`
- `consultation_orthopedics`
- `consultation_gynecology_obstetrics`
- `consultation_dentistry`

The current frontend uses shared consultation payloads instead:

- `consultations.speciality_payload`
- `consultations.shared_payload`
- `consultation_observations.data`

### Review carefully before removing

These are not currently part of the active core launch flow, but they may still be intentional for future modules:

- `virtual_clinics`
- `doctor_specialities`
- `clinic_speciality_tools`
- `clinic_expenses`
- `clinic_invoices`
- `lab_test_catalog`
- `lab_test_panels`
- `lab_test_panel_items`
- `lab_orders`
- `lab_order_items`
- `lab_results`
- `treatment_cases`
- `speciality_field_definitions`
- `doctor_field_preferences`
- `doctor_profile_specialities`

Do not drop those automatically unless you are intentionally cutting those modules from v1 and have confirmed no backend job, RPC, or upcoming UI depends on them.

## 6. Suggested execution order

1. Hide unfinished screens from navigation.
2. Deploy missing SQL and edge functions.
3. Verify env vars and production auth/invite routes.
4. Clean up legacy specialty consultation tables with the guarded SQL migration.
5. Decide whether to defer or remove labs, invoices, expenses, and speciality-tool modules from v1.
