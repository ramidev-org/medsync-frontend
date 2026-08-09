import { callRpc } from "@/services/backend";
import type { PrescriptionRow, PrescriptionStatus } from "@/services/backend.types";

export type UpsertPrescriptionMedicationInput = {
  name: string;
  catalogId?: string | null;
  quantity?: number | null;
  dose?: string | null;
  frequency?: string | null;
  duration?: string | null;
  instructions?: string | null;
};

export async function getPrescriptions(params: {
  requesterId: string;
  consultationId?: string | null;
  patientId?: string | null;
  limit?: number;
}): Promise<PrescriptionRow[]> {
  return callRpc<PrescriptionRow[], Record<string, unknown>>(
    "rpc_get_prescriptions",
    {
      p_requester_id: params.requesterId,
      p_consultation_id: params.consultationId ?? null,
      p_patient_id: params.patientId ?? null,
      p_limit: params.limit ?? 20,
    },
  );
}

export async function upsertPrescription(params: {
  requesterId: string;
  consultationId: string;
  patientId: string;
  prescriptionId?: string | null;
  templateName?: string | null;
  signedBy?: string | null;
  status?: PrescriptionStatus | null;
  notes?: string | null;
  medications: UpsertPrescriptionMedicationInput[];
}): Promise<PrescriptionRow> {
  return callRpc<PrescriptionRow, Record<string, unknown>>(
    "rpc_upsert_prescription",
    {
      p_requester_id: params.requesterId,
      p_consultation_id: params.consultationId,
      p_patient_id: params.patientId,
      p_prescription_id: params.prescriptionId ?? null,
      p_template_name: params.templateName ?? null,
      p_signed_by: params.signedBy ?? null,
      p_status: params.status ?? "draft",
      p_notes: params.notes ?? null,
      p_medications: params.medications.map((item) => ({
        catalog_id: item.catalogId ?? null,
        medicine_name: item.name,
        quantity: item.quantity ?? 1,
        dose: item.dose ?? null,
        frequency: item.frequency ?? null,
        duration: item.duration ?? null,
        instructions: item.instructions ?? null,
      })),
    },
  );
}
