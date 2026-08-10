import { callRpc } from "@/services/backend";
import type { ClinicExpenseRow, ClinicTaskRow } from "@/services/backend.types";
import { getInventory } from "@/services/inventory.services";
import { getPayments, type Payment } from "@/services/payments.services";
import { getTasks } from "@/services/tasks.services";

type AppointmentRow = {
  id: string;
  scheduled_at: string;
  status: string;
  type: string;
  patient_id?: string | null;
  patient_first_name?: string | null;
  patient_last_name?: string | null;
  doctor_name?: string | null;
};

type RpcGetAppointmentsResponse = {
  appointments: AppointmentRow[];
};

type ConsultationRow = {
  consultation_id: string;
  appointment_id: string;
  patient_id: string;
  doctor_id: string | null;
  status: string;
  speciality_key: string | null;
  opened_at: string;
  closed_at: string | null;
  scheduled_at: string;
  patient_first_name: string;
  patient_last_name: string;
  doctor_name: string | null;
};

type RpcGetConsultationsResponse = {
  consultations: ConsultationRow[];
};

type RpcGetExpensesResponse = {
  expenses: ClinicExpenseRow[];
  total: number;
  page: number;
  itemsPerPage: number;
};

export type AnalyticsPoint = {
  label: string;
  appointments: number;
  consultations: number;
  revenue: number;
};

export type AnalyticsSummary = {
  revenueTotal: number;
  expensesTotal: number;
  appointmentsTotal: number;
  consultationsTotal: number;
  completedAppointments: number;
  cancelledAppointments: number;
  noShowAppointments: number;
  activePatients: number;
  pendingTasks: number;
  doneTasks: number;
};

export type AnalyticsBundle = {
  summary: AnalyticsSummary;
  appointments: AppointmentRow[];
  consultations: ConsultationRow[];
  payments: Payment[];
  expenses: ClinicExpenseRow[];
  tasks: ClinicTaskRow[];
  lowStock: Array<{ id: string; name: string; qty_on_hand: number; reorder_threshold: number }>;
  daily: AnalyticsPoint[];
  appointmentStatus: Array<{ name: string; value: number }>;
  consultationStatus: Array<{ name: string; value: number }>;
  taskStatus: Array<{ name: string; value: number }>;
};

function sameDayBucket(date: Date) {
  return date.toISOString().slice(0, 10);
}

function dateLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function withinRange(value: string | null | undefined, start: Date, end: Date) {
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date >= start && date <= end;
}

function sumBy<T>(rows: T[], pick: (row: T) => number) {
  return rows.reduce((total, row) => total + pick(row), 0);
}

export async function getClinicAnalytics(params: {
  requesterId: string;
  startDate?: Date;
  endDate?: Date;
}): Promise<AnalyticsBundle> {
  const endDate = params.endDate ?? new Date();
  const startDate = params.startDate ?? new Date(endDate.getTime() - 29 * 24 * 60 * 60 * 1000);
  const startIso = new Date(startDate);
  startIso.setHours(0, 0, 0, 0);
  const endIso = new Date(endDate);
  endIso.setHours(23, 59, 59, 999);

  const [appointmentsRes, consultationsRes, payments, expensesRes, inventoryRes, tasks] =
    await Promise.all([
      callRpc<RpcGetAppointmentsResponse, Record<string, unknown>>(
        "rpc_get_appointments",
        {
          p_requester_id: params.requesterId,
          p_search: null,
          p_status: null,
          p_doctor_id: null,
          p_start_date: startIso.toISOString(),
          p_end_date: endIso.toISOString(),
          p_page: 1,
          p_items_per_page: 250,
        },
      ),
      callRpc<RpcGetConsultationsResponse, Record<string, unknown>>(
        "rpc_get_consultations",
        {
          p_requester_id: params.requesterId,
          p_search: null,
          p_status: null,
          p_page: 1,
          p_items_per_page: 250,
        },
      ).catch(() => ({ consultations: [] })),
      getPayments({ requesterId: params.requesterId }),
      callRpc<RpcGetExpensesResponse, Record<string, unknown>>(
        "rpc_get_expenses",
        {
          p_requester_id: params.requesterId,
          p_start_date: startIso.toISOString(),
          p_end_date: endIso.toISOString(),
          p_page: 1,
          p_items_per_page: 250,
        },
      ).catch(() => ({ expenses: [], total: 0, page: 1, itemsPerPage: 250 })),
      getInventory({
        requesterId: params.requesterId,
        page: 1,
        itemsPerPage: 200,
      }).catch(() => ({ items: [], total: 0, page: 1, itemsPerPage: 200 })),
      getTasks(params.requesterId).catch(() => []),
    ]);

  const appointments = appointmentsRes?.appointments ?? [];
  const consultations = (consultationsRes?.consultations ?? []).filter((row) =>
    withinRange(row.opened_at || row.scheduled_at, startIso, endIso),
  );
  const rangedPayments = (payments ?? []).filter((row) =>
    withinRange(row.createdAt, startIso, endIso),
  );
  const expenses = (expensesRes?.expenses ?? []).filter((row) =>
    withinRange(row.spent_at, startIso, endIso),
  );
  const lowStock = (inventoryRes?.items ?? []).filter(
    (item: any) => Number(item.qty_on_hand ?? 0) <= Number(item.reorder_threshold ?? 0),
  );

  const dailyBuckets = new Map<string, AnalyticsPoint>();
  const cursor = new Date(startIso);
  while (cursor <= endIso) {
    const key = sameDayBucket(cursor);
    dailyBuckets.set(key, {
      label: dateLabel(cursor),
      appointments: 0,
      consultations: 0,
      revenue: 0,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  appointments.forEach((row) => {
    const key = sameDayBucket(new Date(row.scheduled_at));
    const bucket = dailyBuckets.get(key);
    if (bucket) bucket.appointments += 1;
  });

  consultations.forEach((row) => {
    const key = sameDayBucket(new Date(row.opened_at || row.scheduled_at));
    const bucket = dailyBuckets.get(key);
    if (bucket) bucket.consultations += 1;
  });

  rangedPayments.forEach((row) => {
    const key = sameDayBucket(new Date(row.createdAt));
    const bucket = dailyBuckets.get(key);
    if (bucket) bucket.revenue += Number(row.amount ?? 0);
  });

  const appointmentStatusMap = new Map<string, number>();
  appointments.forEach((row) => {
    const key = String(row.status || "pending");
    appointmentStatusMap.set(key, (appointmentStatusMap.get(key) ?? 0) + 1);
  });

  const consultationStatusMap = new Map<string, number>();
  consultations.forEach((row) => {
    const key = String(row.status || "open");
    consultationStatusMap.set(key, (consultationStatusMap.get(key) ?? 0) + 1);
  });

  const taskStatusMap = new Map<string, number>();
  tasks.forEach((row) => {
    const key = String(row.status || "todo");
    taskStatusMap.set(key, (taskStatusMap.get(key) ?? 0) + 1);
  });

  return {
    summary: {
      revenueTotal: sumBy(rangedPayments, (row) => Number(row.amount ?? 0)),
      expensesTotal: sumBy(expenses, (row) => Number(row.amount ?? 0)),
      appointmentsTotal: appointments.length,
      consultationsTotal: consultations.length,
      completedAppointments: appointments.filter((row) => row.status === "completed").length,
      cancelledAppointments: appointments.filter((row) => row.status === "cancelled").length,
      noShowAppointments: appointments.filter((row) => row.status === "no_show").length,
      activePatients: new Set(
        appointments.map((row) => row.patient_id).filter(Boolean),
      ).size,
      pendingTasks: tasks.filter((row) => row.status !== "done").length,
      doneTasks: tasks.filter((row) => row.status === "done").length,
    },
    appointments,
    consultations,
    payments: rangedPayments,
    expenses,
    tasks,
    lowStock,
    daily: Array.from(dailyBuckets.values()),
    appointmentStatus: Array.from(appointmentStatusMap.entries()).map(([name, value]) => ({
      name,
      value,
    })),
    consultationStatus: Array.from(consultationStatusMap.entries()).map(([name, value]) => ({
      name,
      value,
    })),
    taskStatus: Array.from(taskStatusMap.entries()).map(([name, value]) => ({
      name,
      value,
    })),
  };
}
