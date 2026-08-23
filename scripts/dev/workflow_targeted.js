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

const results = [];

function add(name, ok, details = {}) {
  results.push({ name, ok, ...details });
}

function shortError(error) {
  return error?.message || String(error);
}

function endOfDay(date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
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

async function getFirstPatientId(client, requesterId) {
  const res = await rpc(client, "rpc_get_patients", {
    p_requester_id: requesterId,
    p_page: 1,
    p_items_per_page: 1,
  });
  return res?.patients?.[0]?.id || null;
}

async function main() {
  let doctor;

  try {
    doctor = await login(doctorEmail, doctorPassword);
    add("doctor_login", true, { userId: doctor.user.id });
  } catch (error) {
    add("doctor_login", false, { error: shortError(error) });
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  const client = doctor.client;
  const requesterId = doctor.user.id;
  let createdLabOrderId = null;
  let createdServiceId = null;
  let createdInventoryItemId = null;
  let createdTaskId = null;

  try {
    const patientId = await getFirstPatientId(client, requesterId);
    if (!patientId) throw new Error("No patient available for lab workflow");

    const labList = await rpc(client, "rpc_get_lab_orders", {
      p_requester_id: requesterId,
      p_limit: 10,
    });
    add("analyses_medicales_list", true, {
      count: Array.isArray(labList) ? labList.length : null,
    });

    createdLabOrderId = await rpc(client, "rpc_create_lab_order", {
      p_requester_id: requesterId,
      p_patient_id: patientId,
      p_source_type: "internal",
      p_priority: "routine",
      p_requested_tests: ["FNS", "CRP"],
      p_clinical_context: `QA lab workflow ${uniqueTag}`,
      p_lab_comments: "Created by targeted QA",
      p_payment_status: "pending",
      p_payment_note: "Pending at reception",
      p_estimated_total: 1600,
    });
    add("analyses_medicales_create", !!createdLabOrderId, { labOrderId: createdLabOrderId });

    const labOrder = await rpc(client, "rpc_get_lab_order", {
      p_requester_id: requesterId,
      p_lab_order_id: createdLabOrderId,
    });
    add("analyses_medicales_get", !!labOrder?.id, {
      status: labOrder?.status ?? null,
      requested_tests: Array.isArray(labOrder?.requested_tests) ? labOrder.requested_tests.length : null,
    });

    const savedResults = await rpc(client, "rpc_save_lab_results", {
      p_requester_id: requesterId,
      p_lab_order_id: createdLabOrderId,
      p_status: "completed",
      p_result_items: [
        { name: "FNS", value: "13.4", unit: "g/dL", normal: "12 - 16", note: "Normal" },
        { name: "CRP", value: "8.1", unit: "mg/L", normal: "< 5", note: "Eleve" },
      ],
      p_result_summary: "CRP elevated, CBC acceptable.",
      p_doctor_note: "Follow up if inflammatory symptoms continue.",
    });
    add("analyses_medicales_results", savedResults === true, { saved: savedResults });
  } catch (error) {
    add("analyses_medicales_workflow", false, { error: shortError(error) });
  }

  try {
    const inventory = await rpc(client, "rpc_get_inventory", {
      p_requester_id: requesterId,
      p_page: 1,
      p_items_per_page: 10,
    });
    add("inventory_list", true, {
      total: inventory?.total ?? null,
      sampleCount: inventory?.items?.length ?? null,
    });

    createdInventoryItemId = await rpc(client, "rpc_upsert_inventory_item", {
      p_requester_id: requesterId,
      p_name: `Target QA Item ${uniqueTag}`,
      p_sku: `TGT-${now}`,
      p_unit: "box",
      p_reorder_threshold: 2,
      p_notes: "Created by targeted QA",
    });
    add("inventory_create", !!createdInventoryItemId, { itemId: createdInventoryItemId });

    const adjusted = await rpc(client, "rpc_adjust_inventory", {
      p_requester_id: requesterId,
      p_item_id: createdInventoryItemId,
      p_delta: 4,
      p_reason: "Targeted QA stock adjustment",
    });
    add("inventory_adjust", adjusted === true, { adjusted });
  } catch (error) {
    add("inventory_workflow", false, { error: shortError(error) });
  }

  try {
    const tasks = await rpc(client, "rpc_get_tasks", {
      p_requester_id: requesterId,
    });
    add("tasks_list", true, {
      count: Array.isArray(tasks) ? tasks.length : null,
    });

    const createdTask = await rpc(client, "rpc_create_task", {
      p_requester_id: requesterId,
      p_title: `Target QA Task ${uniqueTag}`,
      p_assignee_name: "Dr Amina Rahmani",
      p_priority: "medium",
      p_due_text: "Tomorrow",
      p_notes: "Created by targeted QA",
    });
    createdTaskId = createdTask?.id || createdTask || null;
    add("tasks_create", !!createdTaskId, { taskId: createdTaskId });

    const updatedTask = await rpc(client, "rpc_update_task", {
      p_requester_id: requesterId,
      p_task_id: createdTaskId,
      p_status: "done",
    });
    add("tasks_update", !!updatedTask, { status: updatedTask?.status || null });
  } catch (error) {
    add("tasks_workflow", false, { error: shortError(error) });
  }

  try {
    const appointments = await rpc(client, "rpc_get_appointments", {
      p_requester_id: requesterId,
      p_start_date: new Date(now - 29 * 86400000).toISOString(),
      p_end_date: new Date(now + 86400000).toISOString(),
      p_page: 1,
      p_items_per_page: 50,
    });
    const consultations = await rpc(client, "rpc_get_consultations", {
      p_requester_id: requesterId,
      p_page: 1,
      p_items_per_page: 50,
    });
    const inventory = await rpc(client, "rpc_get_inventory", {
      p_requester_id: requesterId,
      p_page: 1,
      p_items_per_page: 50,
    });
    const tasks = await rpc(client, "rpc_get_tasks", {
      p_requester_id: requesterId,
    });
    add("statistics_bundle", true, {
      appointments: appointments?.appointments?.length ?? null,
      consultations: consultations?.consultations?.length ?? null,
      inventory: inventory?.items?.length ?? null,
      tasks: Array.isArray(tasks) ? tasks.length : null,
    });
  } catch (error) {
    add("statistics_bundle", false, { error: shortError(error) });
  }

  try {
    const services = await rpc(client, "rpc_get_services", {
      p_requester_id: requesterId,
      p_page: 1,
      p_items_per_page: 20,
    });
    add("services_list", true, {
      total: services?.total ?? null,
      sampleCount: services?.services?.length ?? null,
    });

    createdServiceId = await rpc(client, "rpc_upsert_service", {
      p_requester_id: requesterId,
      p_service_id: null,
      p_code: `SVC-${String(now).slice(-6)}`,
      p_name: `Target QA Service ${uniqueTag}`,
      p_category: "Lab",
      p_color: "#2563EB",
      p_duration_minutes: 25,
      p_price: 1800,
      p_cost: 900,
      p_active: true,
    });
    add("services_create", !!createdServiceId, { serviceId: createdServiceId });

    const toggled = await rpc(client, "rpc_set_service_active", {
      p_requester_id: requesterId,
      p_service_id: createdServiceId,
      p_active: false,
    });
    add("services_toggle_active", toggled === true, { toggled });
  } catch (error) {
    add("services_workflow", false, { error: shortError(error) });
  }

  try {
    const selectedDate = new Date();
    selectedDate.setHours(0, 0, 0, 0);
    const appointments = await rpc(client, "rpc_get_appointments", {
      p_requester_id: requesterId,
      p_search: null,
      p_status: null,
      p_doctor_id: null,
      p_start_date: selectedDate.toISOString(),
      p_end_date: endOfDay(selectedDate).toISOString(),
      p_page: 1,
      p_items_per_page: 180,
    });
    const rows = appointments?.appointments ?? [];
    const counts = rows.reduce((acc, row) => {
      const key = String(row.status || "pending");
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    add("calendar_day_board", true, {
      total: rows.length,
      statuses: counts,
    });
  } catch (error) {
    add("calendar_day_board", false, { error: shortError(error) });
  }

  console.log(JSON.stringify(results, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
