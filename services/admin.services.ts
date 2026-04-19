import { db } from "@/database/database_conn";
import { SUPABASE_ANON_KEY } from "@/database/database_conn";






/* ============================
   USERS & ROLES
============================ */

export async function createUser(payload: {
  email: string;
  password: string;
  role: "doctor" | "reception";
  adminId: string; // current logged-in admin
}) {
  const EDGE_FUNCTION_URL = "https://cxycroqsgmtasgibapen.functions.supabase.co/create-user";

  try {
    const {
      data: { session },
    } = await db.auth.getSession();

    const response = await fetch(EDGE_FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        ...(session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : {}),
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to create user");
    }

    return data.user;
  } catch (err: any) {
    console.error("createUser API error:", err);
    throw err;
  }
}

export async function deactivateUser(userId: string) {
  const { error } = await db.auth.admin.updateUserById(userId, {
    ban_duration: "indefinite",
  });
  if (error) throw error;
}


export async function getDoctorsByAdmin(adminProfileId: string) {
  // Step 1: Get the clinic managed by this admin
  const { data: clinic, error: clinicError } = await db
    .from("clinics")
    .select("id")
    .eq("admin_id", adminProfileId)
    .single();

  if (clinicError) throw clinicError;
  if (!clinic) return [];

  // Step 2: Get all doctors in this clinic
  const { data: doctors, error: doctorsError } = await db
    .from("doctor_profiles")
    .select(`
      *,
      profile: profiles (
        id,
        full_name,
        username,
        email,
        clinic_id
      )
    `)
    .eq("profile.clinic_id", clinic.id);

  if (doctorsError) throw doctorsError;
  return doctors;
}




/* ============================
   VIRTUAL CLINICS
============================ */

/**
 * Get all virtual clinics with readable data
 */
export async function getVirtualClinics(currentAdminId: string) {
  const { data, error } = await db
    .from("virtual_clinics")
    .select(`
      id,
      clinic_id,
      active,
      doctor: doctor_profiles!inner (
        profile: profiles ( full_name )
      ),
      speciality: doctor_specialities ( name )
    `)
    .eq("created_by_admin", currentAdminId);

  if (error) throw error;
  return data;
}


/**
 * Create a virtual clinic
 */
export type CreateClinicPayload = {
  clinic_id: string;        // required
  speciality_id: string;
  doctor_id: string | null;
  created_by_admin: string;
  active: boolean;
};

export async function createVirtualClinic(payload: CreateClinicPayload) {
  return db
    .from("virtual_clinics")
    .insert({
      clinic_id: payload.clinic_id,
      speciality_id: payload.speciality_id,
      doctor_id: payload.doctor_id,
      created_by_admin: payload.created_by_admin,
      active: payload.active,
    })
    .select()
    .single();
}


/**
 * Assign or change doctor
 */
export async function assignDoctorToVirtualClinic(
  virtualClinicId: string,
  doctorId: string | null,
) {
  const { error } = await db
    .from("virtual_clinics")
    .update({ doctor_id: doctorId })
    .eq("id", virtualClinicId);

  if (error) throw error;
}

/* ============================
   AUDIT LOGS - TODO: Update to match schema
============================ */
/*
export async function getAuditLogs() {
  const { data, error } = await db
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}
*/
