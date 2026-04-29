# Schema Gap Analysis (Appointments + Consultation)

## What is already good

- Multi-tenant clinic model exists (`clinic_id` on core tables).
- Appointment lifecycle RPCs already exist: create, update, cancel, list, details.
- Patient core + medical info + measurements are in place.
- Dashboard counts RPC exists for operations monitoring.

## Missing for full consultation product

1. Persistent `consultations` table
- The frontend consultation screen currently edits in-memory data only.
- No canonical row to represent a doctor session linked to an appointment.

2. Specialty payload storage
- New dentistry chart state (tooth statuses, controls, notes) needs JSON persistence.
- Add `speciality_payload jsonb` on consultations or a dedicated table.

3. Clinical data normalization
- Add structured sub-tables instead of storing everything as text fields:
  - consultation_vitals
  - consultation_parameters
  - consultation_diagnoses
  - consultation_documents

4. Prescriptions domain
- No table set for prescription header + line items linked to consultation.

5. Lab / billing linkage
- Existing `payments.visit_id` should point to consultation id or appointment id consistently.
- Add explicit FK strategy and naming consistency (`appointment_id` vs `visit_id`).

6. Audit and timeline
- No audit trail table for sensitive medical edits.
- Add `consultation_events` for status transitions and critical mutations.

## Recommended next DB batch

- Apply `database/sql/004_consultation_core.sql` (added in this update).
- Add RLS policies by `clinic_id` and requester role.
- Add RPCs:
  - `rpc_create_consultation`
  - `rpc_get_consultation`
  - `rpc_save_consultation`
  - `rpc_upsert_consultation_speciality_payload`

## Frontend now aligned with current schema

- Visits page now uses appointment CRUD RPCs directly.
- Consultation page now loads real appointment details and updates appointment status to `completed` on save.
