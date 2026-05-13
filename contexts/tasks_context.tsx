import React, { createContext, useContext, useMemo, useState } from "react";

export type TaskPriority = "high" | "medium" | "low";
export type TaskStatus = "todo" | "in_progress" | "done";

export type TaskRow = {
  id: string;
  title: string;
  assignee: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueText?: string;
};

type TaskForm = {
  title: string;
  assignee: string;
  dueText: string;
  priority: TaskPriority;
};

type TasksContextValue = {
  tasks: TaskRow[];
  stats: { total: number; todo: number; inProgress: number; done: number };
  grouped: Record<TaskStatus, TaskRow[]>;
  addTask: (draft: TaskForm) => void;
  moveTask: (taskId: string, toStatus: TaskStatus) => void;
  recentTasks: TaskRow[];
};

const initialTasks: TaskRow[] = [
  { id: "t1", title: "Prepare today consultation files", assignee: "Solo doctor", priority: "high", status: "todo", dueText: "Today 08:30" },
  { id: "t2", title: "Call patient for follow-up", assignee: "Solo doctor", priority: "medium", status: "in_progress", dueText: "Today 14:00" },
  { id: "t3", title: "Send unpaid invoice reminder", assignee: "Solo doctor", priority: "medium", status: "todo", dueText: "Tomorrow" },
  { id: "t4", title: "Check medication stock", assignee: "Solo doctor", priority: "low", status: "done", dueText: "Completed" },
];

const TasksContext = createContext<TasksContextValue | null>(null);

export function TasksProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<TaskRow[]>(initialTasks);

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

  const addTask = (draft: TaskForm) => {
    if (!draft.title.trim() || !draft.assignee.trim()) return;
    setTasks((prev) => [
      {
        id: `task_${Date.now()}`,
        title: draft.title.trim(),
        assignee: draft.assignee.trim(),
        dueText: draft.dueText.trim() || "Not set",
        priority: draft.priority,
        status: "todo",
      },
      ...prev,
    ]);
  };

  const moveTask = (taskId: string, toStatus: TaskStatus) => {
    setTasks((prev) =>
      prev.map((item) => (item.id === taskId ? { ...item, status: toStatus } : item)),
    );
  };

  const recentTasks = useMemo(
    () => [
      ...tasks.filter((task) => task.status !== "done"),
      ...tasks.filter((task) => task.status === "done"),
    ].slice(0, 4),
    [tasks],
  );

  return (
    <TasksContext.Provider value={{ tasks, stats, grouped, addTask, moveTask, recentTasks }}>
      {children}
    </TasksContext.Provider>
  );
}

export function useTasks() {
  const ctx = useContext(TasksContext);
  if (!ctx) throw new Error("TasksProvider missing");
  return ctx;
}
