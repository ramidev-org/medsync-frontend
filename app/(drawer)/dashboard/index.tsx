import { AppRole, getAppRole } from "@/config/runtime";
import { useAuth } from "@/contexts/auth_context";
import { useAppData } from "@/contexts/appData_context";
import { useMemo } from "react";
import ClinicAdminDashboardPage from "./_clinic_admin";
import ReceptionDashboardPage from "./_reception";
import DoctorDashboardPage from "./_doctor";

export default function DashboardIndex() {
  const { user } = useAuth();
  const { isClinicAdmin } = useAppData();

  const role: AppRole = useMemo(() => {
    const raw = (user?.user_type as any) ?? getAppRole();
    // normalize if your backend uses older naming
    return (raw === "reception" ? "assistant" : raw) as AppRole;
  }, [user]);

  if (role === "doctor") {
    return isClinicAdmin ? <ClinicAdminDashboardPage /> : <DoctorDashboardPage />;
  }

  return <ReceptionDashboardPage />;
}
