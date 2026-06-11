import { callRpc } from "@/services/backend";
import type { ClinicNotificationRow } from "@/services/backend.types";

export async function getNotifications(params: {
  requesterId: string;
  limit?: number;
}): Promise<ClinicNotificationRow[]> {
  return callRpc<ClinicNotificationRow[], Record<string, unknown>>(
    "rpc_get_notifications",
    {
      p_requester_id: params.requesterId,
      p_limit: params.limit ?? 30,
    },
  );
}

export async function markNotificationsRead(params: {
  requesterId: string;
  notificationKeys: string[];
}): Promise<boolean> {
  return callRpc<boolean, Record<string, unknown>>(
    "rpc_mark_notifications_read",
    {
      p_requester_id: params.requesterId,
      p_notification_keys: params.notificationKeys,
    },
  );
}
