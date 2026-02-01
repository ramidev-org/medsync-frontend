// src/contexts/app_data_context.tsx
import { db } from "@/database/database_conn";
import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./auth_context";

type AppData = {
  clinic: any | null;          // single clinic data for current admin
  specialities: any[];
  loading: boolean;
};

const AppDataContext = createContext<AppData | null>(null);

export const AppDataProvider = ({ children }: any) => {
  const [clinic, setClinic] = useState<any | null>(null); // <-- added
  const [specialities, setSpecialities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();

  const clinicId = user?.clinic_id ;

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      // 1️⃣ Load specialities
      const { data: specialitiesData } = await db
        .from("doctor_specialities")
        .select("*")
        .order("name");
      setSpecialities(specialitiesData ?? []);

      // 2️⃣ Load admin's clinic (assuming admin id is known or from auth)
      // Replace `adminId` with the actual current admin id from auth
     
      const { data: clinicData } = await db
        .from("clinics")
        .select("*")
        .eq("id", clinicId)
        .single();

      setClinic(clinicData ?? null);

      setLoading(false);
    };

    load();
  }, []);

  return (
    <AppDataContext.Provider value={{ clinic, specialities, loading }}>
      {children}
    </AppDataContext.Provider>
  );
};

export const useAppData = () => {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("AppDataProvider missing");
  return ctx;
};
