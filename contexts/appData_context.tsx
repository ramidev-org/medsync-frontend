import { db } from "@/database/database_conn";
import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./auth_context";

type AppData = {
  clinic: any | null;
  isClinicAdmin: boolean;
  loading: boolean;
};

const AppDataContext = createContext<AppData | null>(null);

export const AppDataProvider = ({ children }: any) => {
  const [clinic, setClinic] = useState<any | null>(null);
  const [isClinicAdmin, setIsClinicAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();
  const clinicId = user?.clinic_id;

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!cancelled) setLoading(true);

      if (clinicId) {
        const { data: clinicData } = await db
          .from("clinics")
          .select("*")
          .eq("id", clinicId)
          .maybeSingle();
        if (!cancelled) {
          setClinic(clinicData ?? null);
          setIsClinicAdmin(!!clinicData?.admin_id && clinicData.admin_id === user?.id);
        }
      } else if (!cancelled) {
        setClinic(null);
        setIsClinicAdmin(false);
      }

      if (!cancelled) setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [clinicId, user?.id, user?.user_type]);

  return (
    <AppDataContext.Provider value={{ clinic, isClinicAdmin, loading }}>
      {children}
    </AppDataContext.Provider>
  );
};

export const useAppData = () => {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("AppDataProvider missing");
  return ctx;
};
