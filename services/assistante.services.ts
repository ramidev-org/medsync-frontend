import { db } from "@/database/database_conn";
import { IS_DEMO } from "@/config/runtime";

const demoId = (prefix: string) => `${prefix}_${Math.random().toString(16).slice(2, 10)}`;

/* ============================
   APPOINTMENTS
============================ */
export async function createAppointment(payload: any) {
  if (IS_DEMO) return { ...payload, id: demoId("appt") };
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
  if (IS_DEMO) return;
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
  if (IS_DEMO) return;
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
  if (IS_DEMO) return { ...payload, id: demoId("pat") };
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
  if (IS_DEMO) return;
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
  if (IS_DEMO) return { ...payload, id: demoId("inv") };
  const { data, error } = await db
    .from("invoices")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function registerPayment(payload: any) {
  if (IS_DEMO) return { ...payload, id: demoId("pay") };
  const { data, error } = await db
    .from("payments")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}
