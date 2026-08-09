const { createClient } = require("@supabase/supabase-js");

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  throw new Error("Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY");
}

const doctorEmail = "test1@gmail.com";
const doctorPassword = "test1";
const preferredPatientNeedles = ["samir", "khellaf"];

function addResult(results, name, ok, details = {}) {
  results.push({ name, ok, ...details });
}

function shortError(error) {
  return error?.message || String(error);
}

function daysAgoIso(daysAgo, hour = 10) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

async function rpc(client, name, params) {
  const { data, error } = await client.rpc(name, params || {});
  if (error) throw error;
  return data;
}

async function login() {
  const client = createClient(url, key);
  const { data, error } = await client.auth.signInWithPassword({
    email: doctorEmail,
    password: doctorPassword,
  });
  if (error) throw error;
  return { client, user: data.user, session: data.session };
}

async function getDoctorMeta(client, userId) {
  const { data, error } = await client
    .from("users_metadata")
    .select("id, clinic_id, full_name")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data;
}

async function pickPatient(client, requesterId) {
  const data = await rpc(client, "rpc_get_patients", {
    p_requester_id: requesterId,
    p_page: 1,
    p_items_per_page: 100,
  });
  const patients = data?.patients ?? [];
  if (!patients.length) throw new Error("No patients found in clinic.");

  const preferred = patients.find((patient) => {
    const fullName = `${patient.first_name ?? ""} ${patient.last_name ?? ""}`.toLowerCase();
    return preferredPatientNeedles.every((needle) => fullName.includes(needle));
  });

  return preferred ?? patients[0];
}

function buildObservationPayload(index) {
  const weight = 78 - index;
  const height = 176;
  const systolic = 118 + index;
  const diastolic = 76 + Math.max(0, index - 1);
  const temperature = 36.4 + index * 0.1;
  const glycemie = (0.82 + index * 0.06).toFixed(2);
  const hba1c = (5.4 + index * 0.15).toFixed(1);

  return {
    weight_kg: String(weight),
    poids_kg: String(weight),
    height_cm: String(height),
    taille_cm: String(height),
    blood_pressure: `${systolic}/${diastolic}`,
    systolic_bp: String(systolic),
    diastolic_bp: String(diastolic),
    temperature_c: String(Number(temperature.toFixed(1))),
    glycemie,
    hba1c,
    motif_consultation: index % 2 === 0 ? "Suivi controle" : "Controle metabolique",
    examen_clinique: `Observation seed ${index + 1}`,
    conclusion: `Etat stable ${index + 1}`,
  };
}

async function seedMeasurement(client, requesterId, patientId, index) {
  return rpc(client, "rpc_add_patient_measurement", {
    p_requester_id: requesterId,
    p_patient_id: patientId,
    p_weight: 78 - index,
    p_height: 176,
    p_temperature: Number((36.4 + index * 0.1).toFixed(1)),
    p_systolic_bp: 118 + index,
    p_diastolic_bp: 76 + Math.max(0, index - 1),
    p_oxygen_saturation: 98,
    p_notes: `Chart seed measurement ${index + 1}`,
  });
}

async function getConsultationsForPatient(client, requesterId, patientId) {
  const data = await rpc(client, "rpc_get_consultations", {
    p_requester_id: requesterId,
    p_page: 1,
    p_items_per_page: 50,
  });
  return (data?.consultations ?? []).filter((row) => row.patient_id === patientId);
}

async function main() {
  const results = [];
  const measurementIds = [];
  const observationSeeded = [];

  try {
    const { client, user } = await login();
    addResult(results, "doctor_login", true, { userId: user.id });

    const doctorMeta = await getDoctorMeta(client, user.id);
    addResult(results, "doctor_meta", true, {
      clinicId: doctorMeta.clinic_id,
      doctorName: doctorMeta.full_name,
    });

    const patient = await pickPatient(client, user.id);
    addResult(results, "target_patient", true, {
      patientId: patient.id,
      patientName: `${patient.first_name} ${patient.last_name}`,
    });

    for (let index = 0; index < 6; index += 1) {
      const measurementId = await seedMeasurement(client, user.id, patient.id, index);
      measurementIds.push(measurementId);
    }

    let observationError = null;
    try {
      const consultations = await getConsultationsForPatient(client, user.id, patient.id);
      const generalMedicineRows = consultations.filter((row) => {
        const key = String(row.speciality_key ?? "").toLowerCase();
        return key.includes("general");
      });

      for (let index = 0; index < generalMedicineRows.length; index += 1) {
        const row = generalMedicineRows[index];
        await rpc(client, "rpc_save_consultation_observations", {
          p_requester_id: user.id,
          p_consultation_id: row.consultation_id,
          p_speciality_key: "general_medicine",
          p_data: buildObservationPayload(index + 1),
        });
        observationSeeded.push(row.consultation_id);
      }
    } catch (error) {
      observationError = shortError(error);
    }

    addResult(results, "chart_seed_complete", true, {
      measurementSeedCount: measurementIds.length,
      observationSeedCount: observationSeeded.length,
      targetPatient: `${patient.first_name} ${patient.last_name}`,
      measurementIds,
      observationSeeded,
      observationError,
      note: "Open Samir Khellaf > consultation > Graphiques. Vitals tabs now read patient measurements. Consultation observation seeding depends on a backend constraint and may remain empty for glycemie/HbA1c until that RPC is fixed.",
    });
  } catch (error) {
    addResult(results, "chart_seed_complete", false, { error: shortError(error) });
  }

  console.log(JSON.stringify(results, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
