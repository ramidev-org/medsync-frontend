import { IS_DEMO } from "@/config/runtime";
import { db } from "@/database/database_conn";

const demoId = (prefix: string) => `${prefix}_${Math.random().toString(16).slice(2, 10)}`;

/* ============================
   DOCTOR PROFILE
============================ */
export async function getDoctorProfile(profileId: string) {
  if (IS_DEMO) return null;
  const { data, error } = await db
    .from("doctor_profiles")
    .select("*")
    .eq("id", profileId)
    .single();
  if (error) throw error;
  return data;
}

export async function updateDoctorProfile(
  profileId: string,
  payload: any,
) {
  if (IS_DEMO) return;
  const { error } = await db
    .from("doctor_profiles")
    .update(payload)
    .eq("id", profileId);
  if (error) throw error;
}

/* ============================
   APPOINTMENTS (READ ONLY)
============================ */
export async function getDoctorAgenda(
  doctorId: string,
  date?: string,
) {
  if (IS_DEMO) return [];
  let q = db
    .from("appointments")
    .select("*, patient:patients(*)")
    .eq("doctor_id", doctorId);

  if (date) q = q.eq("date", date);

  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status:
    | "pending"
    | "in_consultation"
    | "completed"
    | "cancelled"
    | "no_show",
) {
  if (IS_DEMO) return;
  const { error } = await db
    .from("appointments")
    .update({ status })
    .eq("id", appointmentId);
  if (error) throw error;
}

/* ============================
   CONSULTATION
============================ */
export async function openConsultation(appointmentId: string) {
  if (IS_DEMO)
    return {
      id: demoId("cons"),
      appointment_id: appointmentId,
      status: "open",
      started_at: new Date(),
    };
  const { data, error } = await db
    .from("consultations")
    .insert({
      appointment_id: appointmentId,
      status: "open",
      started_at: new Date(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function closeConsultation(
  consultationId: string,
  payload: {
    diagnosis?: string;
    notes?: string;
    treatment?: string;
    follow_up?: string;
  },
) {
  if (IS_DEMO) return;
  const { error } = await db
    .from("consultations")
    .update({
      ...payload,
      status: "closed",
      closed_at: new Date(),
    })
    .eq("id", consultationId);

  if (error) throw error;
}

/* ============================
   PRESCRIPTIONS
============================ */
export async function createPrescription(payload: any) {
  if (IS_DEMO) return { ...payload, id: demoId("rx") };
  const { data, error } = await db
    .from("prescriptions")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getPrescriptionTemplates(doctorId: string) {
  if (IS_DEMO) return [];
  const { data, error } = await db
    .from("prescription_templates")
    .select("*")
    .eq("doctor_id", doctorId);
  if (error) throw error;
  return data;
}

/* ============================
   MEDICAL RECORDS
============================ */
export async function getPatientMedicalHistory(patientId: string) {
  if (IS_DEMO) return [];
  const { data, error } = await db
    .from("consultations")
    .select("*, prescriptions(*)")
    .eq("patient_id", patientId);
  if (error) throw error;
  return data;
}
