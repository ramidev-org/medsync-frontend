import { db } from "@/database/database_conn";

/* ============================
   DOCTOR PROFILE
============================ */
export async function getDoctorProfile(profileId: string) {
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
  const { data, error } = await db
    .from("prescriptions")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getPrescriptionTemplates(doctorId: string) {
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
  const { data, error } = await db
    .from("consultations")
    .select("*, prescriptions(*)")
    .eq("patient_id", patientId);
  if (error) throw error;
  return data;
}
