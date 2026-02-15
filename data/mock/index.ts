// data/mock/index.ts
// Single entry-point for all prototype/mock data.

import preview from "./preview_data.json";
import { chartData } from "./chart_data";
import { MOCK_PAYMENTS } from "./payments_data";
import { MOCK_USERS } from "./admin_users";
import { MOCK_CLINICS } from "./clinics_data";

export const MOCK = {
  preview,
  // convenience aliases
  doctor: preview.doctor,
  patients: preview.patients,
  appointments: preview.appointments,
  consultations: preview.consultations,
  prescriptions: preview.prescriptions,
  clinics: (preview as any).clinics ?? [],
  specialities: (preview as any).specialities ?? [],
  chartData,
  payments: MOCK_PAYMENTS,
  adminUsers: MOCK_USERS,
  adminClinics: MOCK_CLINICS,
};

export default MOCK;
