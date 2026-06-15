const { createClient } = require("@supabase/supabase-js");

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  throw new Error("Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY");
}

const now = Date.now();
const uniqueTag = `qa-${now}`;
const doctorEmail = "test1@gmail.com";
const doctorPassword = "test1";
const assistantEmail = "test3@gmail.com";
const assistantPassword = "test3";
const atlasAssistantId = "8b0e2ee3-de51-478e-9ad0-d909152aba69";

const results = [];

function add(name, ok, details = {}) {
  results.push({ name, ok, ...details });
}

function shortError(error) {
  return error?.message || String(error);
}

async function login(email, password) {
  const client = createClient(url, key);
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return { client, session: data.session, user: data.user };
}

async function rpc(client, name, params) {
  const { data, error } = await client.rpc(name, params || {});
  if (error) throw error;
  return data;
}

async function queryPayments(client) {
  const { data, error } = await client
    .from("payments")
    .select(
      "id, amount, created_at, visit_id, patient_id, reference, method, status, patients(last_name, first_name, code)",
    )
    .order("created_at", { ascending: false })
    .limit(5);
  if (error) throw error;
  return data || [];
}

async function main() {
  let doctor;
  let assistant;
  let createdPatientId = null;
  let createdAppointmentId = null;
  let createdConsultationId = null;
  let createdInventoryItemId = null;
  let createdTaskId = null;

  try {
    doctor = await login(doctorEmail, doctorPassword);
    add("doctor_login", true, { userId: doctor.user.id });
  } catch (error) {
    add("doctor_login", false, { error: shortError(error) });
  }

  try {
    assistant = await login(assistantEmail, assistantPassword);
    add("assistant_login", true, { userId: assistant.user.id });
  } catch (error) {
    add("assistant_login", false, { error: shortError(error) });
  }

  if (doctor) {
    try {
      const meta = await doctor.client
        .from("users_metadata")
        .select("id, clinic_id, user_type, full_name")
        .eq("id", doctor.user.id)
        .maybeSingle();
      add("doctor_profile_lookup", !meta.error && !!meta.data, {
        data: meta.data || null,
        error: meta.error?.message || null,
      });
    } catch (error) {
      add("doctor_profile_lookup", false, { error: shortError(error) });
    }

    try {
      const counts = await rpc(doctor.client, "rpc_get_clinic_dashboard_counts", {
        p_requester_id: doctor.user.id,
      });
      add("dashboard_counts", true, { counts });
    } catch (error) {
      add("dashboard_counts", false, { error: shortError(error) });
    }

    try {
      const staff = await rpc(doctor.client, "rpc_get_clinic_staff", {
        p_requester_id: doctor.user.id,
      });
      add("clinic_staff_list", Array.isArray(staff) && staff.length >= 1, {
        count: Array.isArray(staff) ? staff.length : null,
      });
    } catch (error) {
      add("clinic_staff_list", false, { error: shortError(error) });
    }

    try {
      const patients = await rpc(doctor.client, "rpc_get_patients", {
        p_requester_id: doctor.user.id,
        p_page: 1,
        p_items_per_page: 5,
      });
      add("patients_list", true, {
        total: patients?.total ?? null,
        sampleCount: patients?.patients?.length ?? null,
      });
    } catch (error) {
      add("patients_list", false, { error: shortError(error) });
    }

    try {
      createdPatientId = await rpc(doctor.client, "rpc_create_patient", {
        p_created_by: doctor.user.id,
        p_first_name: "QA",
        p_last_name: `Patient ${uniqueTag}`,
        p_date_of_birth: "1993-04-15",
        p_place_of_birth: "Lagos",
        p_sex: "male",
        p_marital_status: "single",
        p_phone: `0800${String(now).slice(-7)}`,
        p_email: `${uniqueTag}@example.test`,
        p_address_street: "1 Test Street",
        p_address_city: "Atlas City",
        p_address_state: "QA State",
        p_blood_type: "O+",
        p_allergies: ["dust"],
        p_chronic_diseases: ["none"],
        p_medications: ["none"],
        p_disabilities: null,
        p_height: 180,
        p_weight: 78,
      });
      add("patient_create", !!createdPatientId, { patientId: createdPatientId });
    } catch (error) {
      add("patient_create", false, { error: shortError(error) });
    }

    if (createdPatientId) {
      try {
        const medical = await rpc(doctor.client, "rpc_get_patient_medical", {
          p_requester_id: doctor.user.id,
          p_patient_id: createdPatientId,
        });
        add("patient_medical_info", !!medical?.patient, {
          patientCode: medical?.patient?.code || null,
          hasMedicalInfo: !!medical?.medical_info,
          hasMeasurement: !!medical?.latest_measurement,
        });
      } catch (error) {
        add("patient_medical_info", false, { error: shortError(error) });
      }
    }

    try {
      const appointments = await rpc(doctor.client, "rpc_get_appointments", {
        p_requester_id: doctor.user.id,
        p_start_date: new Date(now - 30 * 86400000).toISOString(),
        p_end_date: new Date(now + 30 * 86400000).toISOString(),
        p_page: 1,
        p_items_per_page: 10,
      });
      add("appointments_list", true, {
        total: appointments?.total ?? null,
        sampleCount: appointments?.appointments?.length ?? null,
      });
    } catch (error) {
      add("appointments_list", false, { error: shortError(error) });
    }

    if (createdPatientId) {
      try {
        createdAppointmentId = await rpc(doctor.client, "rpc_create_appointment", {
          p_requester_id: doctor.user.id,
          p_patient_id: createdPatientId,
          p_doctor_id: doctor.user.id,
          p_scheduled_at: new Date(now + 2 * 3600000).toISOString(),
          p_status: "pending",
          p_type: "consultation",
          p_notes: `Workflow test ${uniqueTag}`,
        });
        add("appointment_create", !!createdAppointmentId, {
          appointmentId: createdAppointmentId,
        });
      } catch (error) {
        add("appointment_create", false, { error: shortError(error) });
      }
    }

    if (createdAppointmentId) {
      try {
        const updated = await rpc(doctor.client, "rpc_update_appointment", {
          p_requester_id: doctor.user.id,
          p_appointment_id: createdAppointmentId,
          p_status: "confirmed",
        });
        add("appointment_update_status", updated === true, { updated });
      } catch (error) {
        add("appointment_update_status", false, { error: shortError(error) });
      }

      try {
        const opened = await rpc(doctor.client, "rpc_open_consultation", {
          p_requester_id: doctor.user.id,
          p_appointment_id: createdAppointmentId,
        });
        createdConsultationId = opened?.consultation?.id || null;
        add("consultation_open", !!createdConsultationId, {
          consultationId: createdConsultationId,
          appointmentStatusAfterOpen: opened?.consultation?.status || null,
        });
      } catch (error) {
        add("consultation_open", false, { error: shortError(error) });
      }
    }

    if (createdConsultationId) {
      try {
        const consultation = await rpc(doctor.client, "rpc_get_consultation", {
          p_requester_id: doctor.user.id,
          p_consultation_id: createdConsultationId,
        });
        add("consultation_get", !!consultation?.consultation, {
          hasDocuments: Array.isArray(consultation?.documents),
        });
      } catch (error) {
        add("consultation_get", false, { error: shortError(error) });
      }

      try {
        const saved = await rpc(doctor.client, "rpc_save_consultation", {
          p_requester_id: doctor.user.id,
          p_consultation_id: createdConsultationId,
          p_observations: `Observation ${uniqueTag}`,
          p_treatment_plan: "Rest and hydration",
          p_follow_up: "Follow up in one week",
          p_status: "open",
          p_vitals: { temperature: "36.7" },
          p_parameters: { motif_consultation: "QA workflow validation" },
          p_diagnoses: [{ label: "Test diagnosis", notes: "Created by workflow test" }],
          p_speciality_key: "general_medicine",
          p_speciality_payload: { notes: "Saved through automated QA" },
        });
        add("consultation_save", saved === true, { saved });
      } catch (error) {
        add("consultation_save", false, { error: shortError(error) });
      }

      try {
        const createdDoc = await rpc(doctor.client, "rpc_create_consultation_document", {
          p_requester_id: doctor.user.id,
          p_consultation_id: createdConsultationId,
          p_patient_id: createdPatientId,
          p_name: `QA Doc ${uniqueTag}`,
          p_kind: "PDF",
          p_document_type: "report",
          p_title: "Workflow test document",
          p_notes: "Created by QA",
          p_mime_type: "application/pdf",
          p_url: "https://example.test/doc.pdf",
        });
        add("consultation_document_create", !!createdDoc?.id, {
          documentId: createdDoc?.id || null,
        });
        if (createdDoc?.id) {
          const deleted = await rpc(doctor.client, "rpc_delete_consultation_document", {
            p_requester_id: doctor.user.id,
            p_document_id: createdDoc.id,
          });
          add("consultation_document_delete", deleted === true, { deleted });
        }
      } catch (error) {
        add("consultation_document_flow", false, { error: shortError(error) });
      }

      try {
        const closed = await rpc(doctor.client, "rpc_close_consultation", {
          p_requester_id: doctor.user.id,
          p_consultation_id: createdConsultationId,
        });
        add("consultation_close", closed === true, { closed });
      } catch (error) {
        add("consultation_close", false, { error: shortError(error) });
      }
    }

    if (createdAppointmentId) {
      try {
        const cancelled = await rpc(doctor.client, "rpc_cancel_appointment", {
          p_requester_id: doctor.user.id,
          p_appointment_id: createdAppointmentId,
        });
        add("appointment_cancel_after_close", cancelled === true, { cancelled });
      } catch (error) {
        add("appointment_cancel_after_close", false, { error: shortError(error) });
      }
    }

    try {
      const consultations = await rpc(doctor.client, "rpc_get_consultations", {
        p_requester_id: doctor.user.id,
        p_page: 1,
        p_items_per_page: 10,
      });
      add("consultations_list", true, {
        total: consultations?.total ?? null,
        sampleCount: consultations?.consultations?.length ?? null,
      });
    } catch (error) {
      add("consultations_list", false, { error: shortError(error) });
    }

    try {
      const payments = await queryPayments(doctor.client);
      add("payments_list", true, { count: payments.length });
    } catch (error) {
      add("payments_list", false, { error: shortError(error) });
    }

    try {
      const inventory = await rpc(doctor.client, "rpc_get_inventory", {
        p_requester_id: doctor.user.id,
        p_page: 1,
        p_items_per_page: 10,
      });
      add("inventory_list", true, {
        total: inventory?.total ?? null,
        sampleCount: inventory?.items?.length ?? null,
      });
    } catch (error) {
      add("inventory_list", false, { error: shortError(error) });
    }

    try {
      createdInventoryItemId = await rpc(doctor.client, "rpc_upsert_inventory_item", {
        p_requester_id: doctor.user.id,
        p_name: `QA Item ${uniqueTag}`,
        p_sku: `SKU-${now}`,
        p_unit: "box",
        p_reorder_threshold: 3,
        p_notes: "Created by QA workflow",
      });
      add("inventory_create", !!createdInventoryItemId, {
        itemId: createdInventoryItemId,
      });
    } catch (error) {
      add("inventory_create", false, { error: shortError(error) });
    }

    if (createdInventoryItemId) {
      try {
        const adjusted = await rpc(doctor.client, "rpc_adjust_inventory", {
          p_requester_id: doctor.user.id,
          p_item_id: createdInventoryItemId,
          p_delta: 5,
          p_reason: "QA stock adjustment",
        });
        add("inventory_adjust", adjusted === true, { adjusted });
      } catch (error) {
        add("inventory_adjust", false, { error: shortError(error) });
      }
    }

    try {
      const notifications = await rpc(doctor.client, "rpc_get_notifications", {
        p_requester_id: doctor.user.id,
        p_limit: 10,
      });
      add("notifications_list", true, {
        count: Array.isArray(notifications) ? notifications.length : null,
      });
    } catch (error) {
      add("notifications_list", false, { error: shortError(error) });
    }

    try {
      const createdTask = await rpc(doctor.client, "rpc_create_task", {
        p_requester_id: doctor.user.id,
        p_title: `QA Task ${uniqueTag}`,
        p_assignee_name: "Dr Amina Rahmani",
        p_priority: "medium",
        p_due_text: "Tomorrow",
        p_notes: "Created by workflow QA",
      });
      createdTaskId = createdTask?.id || createdTask || null;
      add("task_create", !!createdTaskId, { taskId: createdTaskId });
      if (createdTaskId) {
        const updatedTask = await rpc(doctor.client, "rpc_update_task", {
          p_requester_id: doctor.user.id,
          p_task_id: createdTaskId,
          p_status: "done",
        });
        add("task_update", !!updatedTask, { status: updatedTask?.status || null });
      }
    } catch (error) {
      add("task_flow", false, { error: shortError(error) });
    }

    try {
      const conversationId = await rpc(
        doctor.client,
        "rpc_get_or_create_direct_conversation",
        {
          p_requester_id: doctor.user.id,
          p_other_user_id: atlasAssistantId,
        },
      );
      add("chat_conversation_get_or_create", !!conversationId, {
        conversationId,
      });
      if (conversationId) {
        const messageId = await rpc(doctor.client, "rpc_send_message", {
          p_requester_id: doctor.user.id,
          p_conversation_id: conversationId,
          p_body: `Workflow QA message ${uniqueTag}`,
        });
        add("chat_send_message", !!messageId, { messageId });
        const messages = await rpc(doctor.client, "rpc_get_messages", {
          p_requester_id: doctor.user.id,
          p_conversation_id: conversationId,
          p_limit: 5,
        });
        add("chat_get_messages", Array.isArray(messages), {
          count: Array.isArray(messages) ? messages.length : null,
        });
      }
    } catch (error) {
      add("chat_flow", false, { error: shortError(error) });
    }

    try {
      const inviteEmail = `invite+${uniqueTag}@example.test`;
      const result = await doctor.client.functions.invoke("create-staff-invite", {
        body: { email: inviteEmail, user_type: "assistant" },
        headers: { Authorization: `Bearer ${doctor.session.access_token}` },
      });
      if (result.error) throw result.error;
      add("staff_invite_create", true, {
        hasInviteUrl: !!(result.data?.invite_url || result.data?.url || result.data?.link),
        hasToken: !!(result.data?.invite_token || result.data?.token),
      });
    } catch (error) {
      add("staff_invite_create", false, { error: shortError(error) });
    }

    try {
      const analyticsAppointments = await rpc(doctor.client, "rpc_get_appointments", {
        p_requester_id: doctor.user.id,
        p_start_date: new Date(now - 29 * 86400000).toISOString(),
        p_end_date: new Date(now + 86400000).toISOString(),
        p_page: 1,
        p_items_per_page: 50,
      });
      const analyticsConsults = await rpc(doctor.client, "rpc_get_consultations", {
        p_requester_id: doctor.user.id,
        p_page: 1,
        p_items_per_page: 50,
      });
      add("reports_statistics_data_bundle", true, {
        appointments: analyticsAppointments?.appointments?.length ?? null,
        consultations: analyticsConsults?.consultations?.length ?? null,
      });
    } catch (error) {
      add("reports_statistics_data_bundle", false, { error: shortError(error) });
    }
  }

  if (assistant) {
    try {
      const counts = await rpc(assistant.client, "rpc_get_clinic_dashboard_counts", {
        p_requester_id: assistant.user.id,
      });
      add("assistant_dashboard_counts", true, { counts });
    } catch (error) {
      add("assistant_dashboard_counts", false, { error: shortError(error) });
    }

    try {
      const patients = await rpc(assistant.client, "rpc_get_patients", {
        p_requester_id: assistant.user.id,
        p_page: 1,
        p_items_per_page: 5,
      });
      add("assistant_patients_list", true, { total: patients?.total ?? null });
    } catch (error) {
      add("assistant_patients_list", false, { error: shortError(error) });
    }

    try {
      const appointments = await rpc(assistant.client, "rpc_get_appointments", {
        p_requester_id: assistant.user.id,
        p_start_date: new Date(now - 30 * 86400000).toISOString(),
        p_end_date: new Date(now + 30 * 86400000).toISOString(),
        p_page: 1,
        p_items_per_page: 10,
      });
      add("assistant_appointments_list", true, { total: appointments?.total ?? null });
    } catch (error) {
      add("assistant_appointments_list", false, { error: shortError(error) });
    }

    try {
      const result = await assistant.client.functions.invoke("create-staff-invite", {
        body: { email: `blocked+${uniqueTag}@example.test`, user_type: "assistant" },
        headers: { Authorization: `Bearer ${assistant.session.access_token}` },
      });
      if (result.error) throw result.error;
      add("assistant_staff_invite_permission", false, {
        error: "Assistant unexpectedly created invite",
      });
    } catch (error) {
      const message = shortError(error);
      add(
        "assistant_staff_invite_permission",
        /admin|doctor|forbidden|permission|only clinic admin/i.test(message),
        { error: message },
      );
    }
  }

  console.log(JSON.stringify(results, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
