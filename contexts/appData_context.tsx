import { db } from "@/database/database_conn";
import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./auth_context";

type SubscriptionStatus = "active" | "expired" | "revoked" | "missing";

export type SubscriptionInfo = {
  status: SubscriptionStatus;
  tier_plan: string | null;
  license_id: string | null;
  expires_at: string | null;
  days_left: number | null;
  max_doctors: number | null;
  max_assistants: number | null;
  current_doctors: number | null;
  current_assistants: number | null;
};

type AppData = {
  clinic: any | null;
  isClinicAdmin: boolean;
  subscription: SubscriptionInfo;
  loading: boolean;
};

const AppDataContext = createContext<AppData | null>(null);

const diffDays = (iso: string) => {
  try {
    const d = new Date(iso).getTime();
    const now = Date.now();
    return Math.ceil((d - now) / (1000 * 60 * 60 * 24));
  } catch {
    return null;
  }
};

const DEFAULT_SUBSCRIPTION: SubscriptionInfo = {
  status: "missing",
  tier_plan: null,
  license_id: null,
  expires_at: null,
  days_left: null,
  max_doctors: null,
  max_assistants: null,
  current_doctors: null,
  current_assistants: null,
};

export const AppDataProvider = ({ children }: any) => {
  const [clinic, setClinic] = useState<any | null>(null);
  const [isClinicAdmin, setIsClinicAdmin] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionInfo>(DEFAULT_SUBSCRIPTION);
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

        // License/subscription status (best-effort; does not block UI).
        try {
          const tier_plan = clinicData?.tier_plan ? String(clinicData.tier_plan) : null;
          const license_id = clinicData?.license_id ? String(clinicData.license_id) : null;
          const max_doctors =
            typeof clinicData?.max_doctors === "number" ? clinicData.max_doctors : null;
          const max_assistants =
            typeof clinicData?.max_assistants === "number" ? clinicData.max_assistants : null;

          const [{ count: doctorsCount }, { count: assistantsCount }] = await Promise.all([
            db
              .from("users_metadata")
              .select("id", { count: "exact", head: true })
              .eq("clinic_id", clinicId)
              .eq("user_type", "doctor")
              .eq("active", true),
            db
              .from("users_metadata")
              .select("id", { count: "exact", head: true })
              .eq("clinic_id", clinicId)
              .eq("user_type", "assistant")
              .eq("active", true),
          ]);

          let status: SubscriptionStatus = "missing";
          let expires_at: string | null = null;
          let days_left: number | null = null;

          if (license_id) {
            const { data: licenseData } = await db
              .from("licenses")
              .select("revoked, expires_at")
              .eq("id", license_id)
              .maybeSingle();

            const revoked = !!(licenseData as any)?.revoked;
            expires_at = (licenseData as any)?.expires_at ? String((licenseData as any).expires_at) : null;
            days_left = expires_at ? diffDays(expires_at) : null;

            if (revoked) status = "revoked";
            else if (expires_at && typeof days_left === "number" && days_left < 0) status = "expired";
            else status = "active";
          }

          if (!cancelled) {
            setSubscription({
              status,
              tier_plan,
              license_id,
              expires_at,
              days_left,
              max_doctors,
              max_assistants,
              current_doctors: typeof doctorsCount === "number" ? doctorsCount : null,
              current_assistants: typeof assistantsCount === "number" ? assistantsCount : null,
            });
          }
        } catch {
          if (!cancelled) setSubscription(DEFAULT_SUBSCRIPTION);
        }

      } else if (!cancelled) {
        setClinic(null);
        setIsClinicAdmin(false);
        setSubscription(DEFAULT_SUBSCRIPTION);
      }

      if (!cancelled) setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [clinicId, user?.id, user?.user_type]);

  return (
    <AppDataContext.Provider
      value={{
        clinic,
        isClinicAdmin,
        subscription,
        loading,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
};

export const useAppData = () => {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("AppDataProvider missing");
  return ctx;
};
