import { AppRole, getAppRole } from "@/config/runtime";
import { useAuth } from "@/contexts/auth_context";
import { useMemo } from "react";
import AdminDashboardPage from "./_admin";
import AssistanteDashboardPage from "./_assistant";
import DoctorDashboardPage from "./_doctor";

export default function DashboardIndex() {
  const { user } = useAuth();

  const role: AppRole = useMemo(() => {
    const raw = (user?.role as any) ?? getAppRole();
    // normalize if your backend uses "assistant"
    return (raw === "assistant" ? "assistant" : raw) as AppRole;
  }, [user]);

  if (role === "admin") return <AdminDashboardPage />;
  if (role === "doctor") return <DoctorDashboardPage />;

  // default assistant
  return <AssistanteDashboardPage />;
}
