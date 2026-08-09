import { useAuth } from "@/contexts/auth_context";
import {
  createTask as createTaskRemote,
  getTasks,
  updateTask,
} from "@/services/tasks.services";
import React, {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type TaskPriority = "high" | "medium" | "low";
export type TaskStatus = "todo" | "in_progress" | "done";

export type TaskRow = {
  id: string;
  title: string;
  assignee: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueText?: string;
  notes?: string;
  updatedAt?: string;
};

type TaskForm = {
  title: string;
  assignee: string;
  dueText: string;
  priority: TaskPriority;
  notes?: string;
};

type TasksContextValue = {
  tasks: TaskRow[];
  loading: boolean;
  error: string | null;
  stats: { total: number; todo: number; inProgress: number; done: number };
  grouped: Record<TaskStatus, TaskRow[]>;
  addTask: (draft: TaskForm) => Promise<void>;
  moveTask: (taskId: string, toStatus: TaskStatus) => Promise<void>;
  recentTasks: TaskRow[];
  refresh: () => Promise<void>;
};

const TasksContext = createContext<TasksContextValue | null>(null);

function mapTaskRow(row: any): TaskRow {
  return {
    id: String(row.id),
    title: String(row.title ?? ""),
    assignee: String(row.assignee_name ?? "Clinic team"),
    priority: (row.priority as TaskPriority) ?? "medium",
    status: (row.status as TaskStatus) ?? "todo",
    dueText: row.due_text ? String(row.due_text) : undefined,
    notes: row.notes ? String(row.notes) : undefined,
    updatedAt: row.updated_at ? String(row.updated_at) : undefined,
  };
}

export function TasksProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    if (!user?.id) {
      setTasks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const rows = await getTasks(user.id);
      startTransition(() => {
        setTasks(rows.map(mapTaskRow));
      });
    } catch (err) {
      console.error("Failed to load tasks:", err);
      setError(err instanceof Error ? err.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [user?.id]);

  const stats = useMemo(() => {
    const todo = tasks.filter((item) => item.status === "todo").length;
    const inProgress = tasks.filter((item) => item.status === "in_progress").length;
    const done = tasks.filter((item) => item.status === "done").length;
    return { total: tasks.length, todo, inProgress, done };
  }, [tasks]);

  const grouped = useMemo(
    () => ({
      todo: tasks.filter((item) => item.status === "todo"),
      in_progress: tasks.filter((item) => item.status === "in_progress"),
      done: tasks.filter((item) => item.status === "done"),
    }),
    [tasks],
  );

  const addTask = async (draft: TaskForm) => {
    if (!user?.id || !draft.title.trim() || !draft.assignee.trim()) return;
    const created = await createTaskRemote({
      requesterId: user.id,
      title: draft.title.trim(),
      assigneeName: draft.assignee.trim(),
      dueText: draft.dueText.trim() || null,
      priority: draft.priority,
      notes: draft.notes?.trim() || null,
    });
    startTransition(() => {
      setTasks((prev) => [mapTaskRow(created), ...prev]);
    });
  };

  const moveTask = async (taskId: string, toStatus: TaskStatus) => {
    if (!user?.id) return;
    const previous = tasks;
    startTransition(() => {
      setTasks((prev) =>
        prev.map((item) =>
          item.id === taskId ? { ...item, status: toStatus } : item,
        ),
      );
    });
    try {
      const updated = await updateTask({
        requesterId: user.id,
        taskId,
        status: toStatus,
      });
      startTransition(() => {
        setTasks((prev) =>
          prev.map((item) =>
            item.id === taskId ? mapTaskRow(updated) : item,
          ),
        );
      });
    } catch (err) {
      console.error("Failed to update task:", err);
      setError(err instanceof Error ? err.message : "Failed to update task");
      startTransition(() => {
        setTasks(previous);
      });
    }
  };

  const recentTasks = useMemo(
    () =>
      [...tasks]
        .sort((a, b) => {
          const aScore = a.status === "done" ? 1 : 0;
          const bScore = b.status === "done" ? 1 : 0;
          if (aScore !== bScore) return aScore - bScore;
          return (b.updatedAt || "").localeCompare(a.updatedAt || "");
        })
        .slice(0, 4),
    [tasks],
  );

  return (
    <TasksContext.Provider
      value={{
        tasks,
        loading,
        error,
        stats,
        grouped,
        addTask,
        moveTask,
        recentTasks,
        refresh,
      }}
    >
      {children}
    </TasksContext.Provider>
  );
}

export function useTasks() {
  const ctx = useContext(TasksContext);
  if (!ctx) throw new Error("TasksProvider missing");
  return ctx;
}
