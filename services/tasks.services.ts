import { callRpc } from "@/services/backend";
import type {
  ClinicTaskPriority,
  ClinicTaskRow,
  ClinicTaskStatus,
} from "@/services/backend.types";

export async function getTasks(requesterId: string): Promise<ClinicTaskRow[]> {
  return callRpc<ClinicTaskRow[], Record<string, unknown>>("rpc_get_tasks", {
    p_requester_id: requesterId,
  });
}

export async function createTask(params: {
  requesterId: string;
  title: string;
  assigneeId?: string | null;
  assigneeName?: string | null;
  priority?: ClinicTaskPriority;
  dueText?: string | null;
  dueAt?: string | null;
  notes?: string | null;
}): Promise<ClinicTaskRow> {
  return callRpc<ClinicTaskRow, Record<string, unknown>>("rpc_create_task", {
    p_requester_id: params.requesterId,
    p_title: params.title,
    p_assignee_id: params.assigneeId ?? null,
    p_assignee_name: params.assigneeName ?? null,
    p_priority: params.priority ?? "medium",
    p_due_text: params.dueText ?? null,
    p_due_at: params.dueAt ?? null,
    p_notes: params.notes ?? null,
  });
}

export async function updateTask(params: {
  requesterId: string;
  taskId: string;
  title?: string | null;
  assigneeId?: string | null;
  assigneeName?: string | null;
  priority?: ClinicTaskPriority | null;
  status?: ClinicTaskStatus | null;
  dueText?: string | null;
  dueAt?: string | null;
  notes?: string | null;
}): Promise<ClinicTaskRow> {
  return callRpc<ClinicTaskRow, Record<string, unknown>>("rpc_update_task", {
    p_requester_id: params.requesterId,
    p_task_id: params.taskId,
    p_title: params.title ?? null,
    p_assignee_id: params.assigneeId ?? null,
    p_assignee_name: params.assigneeName ?? null,
    p_priority: params.priority ?? null,
    p_status: params.status ?? null,
    p_due_text: params.dueText ?? null,
    p_due_at: params.dueAt ?? null,
    p_notes: params.notes ?? null,
  });
}
