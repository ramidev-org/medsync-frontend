// src/contexts/app_data_context.tsx
import { db } from "@/database/database_conn";
import { createContext, useContext, useEffect, useState } from "react";

type AppData = {
  specialities: any[];
  loading: boolean;
};

const AppDataContext = createContext<AppData | null>(null);

export const AppDataProvider = ({ children }: any) => {
  const [specialities, setSpecialities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await db
        .from("doctor_specialities")
        .select("*")
        .order("name");

      setSpecialities(data ?? []);
      setLoading(false);
    };

    load();
  }, []);

  return (
    <AppDataContext.Provider value={{ specialities, loading }}>
      {children}
    </AppDataContext.Provider>
  );
};

export const useAppData = () => {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("AppDataProvider missing");
  return ctx;
};
