import { db } from "@/database/database_conn";

/* ============================
   APPOINTMENTS
============================ */
export async function createAppointment(payload: any) {
  const { data, error } = await db
    .from("appointments")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateAppointment(
  appointmentId: string,
  payload: any,
) {
  const { error } = await db
    .from("appointments")
    .update(payload)
    .eq("id", appointmentId);
  if (error) throw error;
}

export async function assignDoctor(
  appointmentId: string,
  doctorId: string,
) {
  const { error } = await db
    .from("appointments")
    .update({ doctor_id: doctorId })
    .eq("id", appointmentId);
  if (error) throw error;
}

export async function registerWalkIn(payload: any) {
  payload.is_walk_in = true;
  return createAppointment(payload);
}

/* ============================
   PATIENTS
============================ */
export async function createPatient(payload: any) {
  const { data, error } = await db
    .from("patients")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePatient(
  patientId: string,
  payload: any,
) {
  const { error } = await db
    .from("patients")
    .update(payload)
    .eq("id", patientId);
  if (error) throw error;
}

/* ============================
   BILLING
============================ */
export async function createInvoice(payload: any) {
  const { data, error } = await db
    .from("invoices")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function registerPayment(payload: any) {
  const { data, error } = await db
    .from("payments")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}
