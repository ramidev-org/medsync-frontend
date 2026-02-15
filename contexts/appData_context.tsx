import { APP_ROLE, IS_DEMO } from "@/config/runtime";
import { db } from "@/database/database_conn";
import preview from "@/data/mock/preview_data.json";
import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./auth_context";

type AppData = {
  clinic: any | null;
  specialities: any[];
  loading: boolean;
};

const AppDataContext = createContext<AppData | null>(null);

export const AppDataProvider = ({ children }: any) => {
  const [clinic, setClinic] = useState<any | null>(null);
  const [specialities, setSpecialities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();
  const clinicId = user?.clinic_id;

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      // Demo: use bundled JSON and skip all database calls.
      if (IS_DEMO) {
        setSpecialities(
          (preview as any).specialities ?? [
            { id: "gen", name: "Médecine générale" },
            { id: "cardio", name: "Cardiologie" },
            { id: "derm", name: "Dermatologie" },
          ],
        );
        setClinic(
          (preview as any).clinic ?? {
            id: "demo-clinic",
            name: "Cabinet Démo",
            state: "Alger",
            city: "Alger",
          },
        );
        setLoading(false);
        return;
      }

      // Real mode
      const { data: specialitiesData } = await db
        .from("doctor_specialities")
        .select("*")
        .order("name");
      setSpecialities(specialitiesData ?? []);

      if (APP_ROLE === "admin" && clinicId) {
        const { data: clinicData } = await db
          .from("clinics")
          .select("*")
          .eq("id", clinicId)
          .single();
        setClinic(clinicData ?? null);
      }

      setLoading(false);
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
