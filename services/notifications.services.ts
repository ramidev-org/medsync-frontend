import type { ClinicNotificationRow } from "@/services/backend.types";
import { db } from "@/database/database_conn";
import { callRpc } from "@/services/backend";

type DashboardAppointmentsResponse = {
  appointments: {
    id: string;
    patient_first_name?: string | null;
    patient_last_name?: string | null;
    scheduled_at: string;
    status: string;
    type: string;
  }[];
};

type InventoryRow = {
  id: string;
  name?: string | null;
  qty_on_hand?: number | null;
  reorder_threshold?: number | null;
  updated_at?: string | null;
};

type InventoryListResponse = {
  items: InventoryRow[];
  total: number;
  page: number;
  itemsPerPage: number;
};

type TaskRow = {
  id: string;
  title: string;
  status: string;
  priority: string;
  assignee_name?: string | null;
  due_at?: string | null;
  updated_at?: string | null;
};

const isMissingRpc = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return message.includes('rpc_get_notifications') || message.includes('rpc_mark_notifications_read');
};

async function getDerivedNotifications(requesterId: string, limit: number): Promise<ClinicNotificationRow[]> {
  const [tasksResult, inventoryResult, invitesResult, appointmentsResult] = await Promise.allSettled([
    callRpc<TaskRow[], Record<string, unknown>>("rpc_get_tasks", {
      p_requester_id: requesterId,
    }),
    callRpc<InventoryListResponse, Record<string, unknown>>("rpc_get_inventory", {
      p_requester_id: requesterId,
      p_page: 1,
      p_items_per_page: 50,
    }),
    db
      .from("users_metadata")
      .select("clinic_id")
      .eq("id", requesterId)
      .single(),
    callRpc<DashboardAppointmentsResponse, Record<string, unknown>>("rpc_get_appointments", {
      p_requester_id: requesterId,
      p_start_date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      p_end_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
      p_page: 1,
      p_items_per_page: 50,
    }),
  ]);

  let clinicId: string | null = null;
  if (invitesResult.status === "fulfilled") {
    clinicId = (invitesResult.value.data as any)?.clinic_id ?? null;
  }

  const inviteRows = clinicId
    ? await db
        .from("staff_invites")
        .select("id, email, user_type, expires_at, accepted_at, created_at")
        .eq("clinic_id", clinicId)
        .is("accepted_at", null)
        .order("created_at", { ascending: false })
        .limit(10)
    : { data: [], error: null };

  const items: ClinicNotificationRow[] = [];

  if (tasksResult.status === "fulfilled") {
    for (const task of tasksResult.value ?? []) {
      if (task.status === "done") continue;
      items.push({
        id: task.id,
        notification_key: `task:${task.id}`,
        kind: "task",
        title: task.priority === "high" ? "High-priority task" : "Open clinic task",
        description: `${task.title}${task.assignee_name ? ` • ${task.assignee_name}` : ""}`,
        created_at: task.updated_at || task.due_at || new Date().toISOString(),
        unread: true,
      });
    }
  }

  if (Array.isArray(inviteRows.data)) {
    for (const invite of inviteRows.data as any[]) {
      items.push({
        id: String(invite.id),
        notification_key: `invite:${invite.id}`,
        kind: "system",
        title: "Pending staff invite",
        description: `${invite.email} is still waiting to join as ${invite.user_type}.`,
        created_at: String(invite.created_at ?? new Date().toISOString()),
        unread: true,
      });
    }
  }

  if (inventoryResult.status === "fulfilled") {
    for (const item of inventoryResult.value?.items ?? []) {
      const quantity = Number(item.qty_on_hand ?? 0);
      const threshold = Number(item.reorder_threshold ?? 0);
      if (threshold > 0 && quantity <= threshold) {
        items.push({
          id: item.id,
          notification_key: `inventory:${item.id}`,
          kind: "system",
          title: "Low stock warning",
          description: `${item.name ?? "Inventory item"} is at ${quantity}/${threshold}.`,
          created_at: item.updated_at || new Date().toISOString(),
          unread: true,
        });
      }
    }
  }

  if (appointmentsResult.status === "fulfilled") {
    for (const appointment of appointmentsResult.value?.appointments ?? []) {
      if (!["pending", "confirmed"].includes(String(appointment.status ?? ""))) continue;
      const patientName = `${appointment.patient_first_name ?? ""} ${appointment.patient_last_name ?? ""}`.trim() || "Patient";
      items.push({
        id: String(appointment.id),
        notification_key: `appointment:${appointment.id}`,
        kind: "follow_up",
        title: "Upcoming appointment",
        description: `${patientName} has a ${appointment.type} appointment scheduled soon.`,
        created_at: String(appointment.scheduled_at),
        unread: true,
      });
    }
  }

  return items
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);
}

export async function getNotifications(params: {
  requesterId: string;
  limit?: number;
}): Promise<ClinicNotificationRow[]> {
  try {
    return await callRpc<ClinicNotificationRow[], Record<string, unknown>>(
      "rpc_get_notifications",
      {
        p_requester_id: params.requesterId,
        p_limit: params.limit ?? 30,
      },
    );
  } catch (error) {
    if (!isMissingRpc(error)) throw error;
    return getDerivedNotifications(params.requesterId, params.limit ?? 30);
  }
}

export async function markNotificationsRead(params: {
  requesterId: string;
  notificationKeys: string[];
}): Promise<boolean> {
  try {
    return await callRpc<boolean, Record<string, unknown>>(
      "rpc_mark_notifications_read",
      {
        p_requester_id: params.requesterId,
        p_notification_keys: params.notificationKeys,
      },
    );
  } catch (error) {
    if (!isMissingRpc(error)) throw error;
    return true;
  }
}
