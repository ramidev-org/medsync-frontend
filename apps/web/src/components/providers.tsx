"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getAppRole, getDoctorSpeciality, getIsClinicAdminOverride } from "@/lib/runtime";
import { getSupabaseBrowserClient, hasSupabaseBrowserEnv } from "@/lib/supabase";
import type { AppUser, DbRecord } from "@/lib/user";
import { mapUserFromDb } from "@/lib/user";

type AuthContextValue = {
  user: AppUser | null;
  session: Session | null;
  loading: boolean;
  configured: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

type SubscriptionStatus = "active" | "expired" | "revoked" | "missing";

type SubscriptionInfo = {
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

type ClinicRecord = Record<string, unknown>;

type AppDataValue = {
  clinic: ClinicRecord | null;
  isClinicAdmin: boolean;
  subscription: SubscriptionInfo;
  loading: boolean;
  configured: boolean;
  runtimeRole: ReturnType<typeof getAppRole>;
  runtimeSpeciality: string;
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

const AuthContext = createContext<AuthContextValue | null>(null);
const AppDataContext = createContext<AppDataValue | null>(null);

let loadedUserId: string | null = null;

function diffDays(iso: string) {
  try {
    const target = new Date(iso).getTime();
    return Math.ceil((target - Date.now()) / (1000 * 60 * 60 * 24));
  } catch {
    return null;
  }
}

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const configured = hasSupabaseBrowserEnv();
  const [loading, setLoading] = useState(configured);
  const initialized = useRef(false);

  const loadUser = async (id: string) => {
    if (!id || loadedUserId === id) {
      setLoading(false);
      return;
    }

    loadedUserId = id;

    try {
      const supabase = getSupabaseBrowserClient();
      const { data: meta, error: metaError } = await supabase
        .from("users_metadata")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (metaError || !meta) {
        loadedUserId = null;
        setUser(null);
        await supabase.auth.signOut();
        return;
      }

      const userType =
        String(meta.user_type ?? "").toLowerCase() === "doctor" ? "doctor" : "assistant";

      let doctorProfile: DbRecord | null = null;
      let assistantProfile: DbRecord | null = null;

      if (userType === "doctor") {
        const { data } = await supabase
          .from("doctor_profiles")
          .select("*")
          .eq("id", id)
          .maybeSingle();
        doctorProfile = data ?? null;
      } else {
        const { data } = await supabase
          .from("assistant_profiles")
          .select("*")
          .eq("id", id)
          .maybeSingle();
        assistantProfile = data ?? null;
      }

      setUser(
        mapUserFromDb({
          ...meta,
          doctor_profiles: doctorProfile,
          assistant_profiles: assistantProfile,
        }),
      );
    } catch {
      loadedUserId = null;
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    if (!configured) {
      return;
    }

    const bootstrap = async () => {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { session: initialSession },
      } = await supabase.auth.getSession();

      if (initialSession?.user?.id) {
        setSession(initialSession);
        await loadUser(initialSession.user.id);
      } else {
        setLoading(false);
      }
    };

    bootstrap();

    const supabase = getSupabaseBrowserClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);

      if (nextSession?.user?.id) {
        await loadUser(nextSession.user.id);
      } else {
        loadedUserId = null;
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [configured]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      loading,
      configured,
      login: async (email: string, password: string) => {
        if (!configured) {
          throw new Error(
            "Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
          );
        }
        const supabase = getSupabaseBrowserClient();
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      },
      logout: async () => {
        if (!configured) return;
        const supabase = getSupabaseBrowserClient();
        await supabase.auth.signOut();
        loadedUserId = null;
        setUser(null);
      },
      refreshUser: async () => {
        if (!configured) return;
        const userId = session?.user?.id;
        if (!userId) return;
        loadedUserId = null;
        setLoading(true);
        await loadUser(userId);
      },
    }),
    [configured, loading, session, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function AppDataProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const [clinic, setClinic] = useState<ClinicRecord | null>(null);
  const [isClinicAdmin, setIsClinicAdmin] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionInfo>(DEFAULT_SUBSCRIPTION);
  const [loading, setLoading] = useState(auth.configured);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!cancelled) setLoading(true);

      const clinicId = auth.user?.clinic_id;
      if (!auth.configured || !clinicId) {
        if (!cancelled) {
          setClinic(null);
          setIsClinicAdmin(getIsClinicAdminOverride());
          setSubscription(DEFAULT_SUBSCRIPTION);
          setLoading(false);
        }
        return;
      }

      const supabase = getSupabaseBrowserClient();
      const { data: clinicData } = await supabase
        .from("clinics")
        .select("*")
        .eq("id", clinicId)
        .maybeSingle();

      if (!cancelled) {
        setClinic(clinicData ?? null);
        setIsClinicAdmin(
          (!!clinicData?.admin_id && clinicData.admin_id === auth.user?.id) ||
            getIsClinicAdminOverride(),
        );
      }

      try {
        const tierPlan = clinicData?.tier_plan ? String(clinicData.tier_plan) : null;
        const licenseId = clinicData?.license_id ? String(clinicData.license_id) : null;

        const [{ count: doctorsCount }, { count: assistantsCount }] = await Promise.all([
          supabase
            .from("users_metadata")
            .select("id", { count: "exact", head: true })
            .eq("clinic_id", clinicId)
            .eq("user_type", "doctor")
            .eq("active", true),
          supabase
            .from("users_metadata")
            .select("id", { count: "exact", head: true })
            .eq("clinic_id", clinicId)
            .eq("user_type", "assistant")
            .eq("active", true),
        ]);

        let status: SubscriptionStatus = "missing";
        let expiresAt: string | null = null;
        let daysLeft: number | null = null;

        if (licenseId) {
          const { data: licenseData } = await supabase
            .from("licenses")
            .select("revoked, expires_at")
            .eq("id", licenseId)
            .maybeSingle();

          const revoked = !!licenseData?.revoked;
          expiresAt = licenseData?.expires_at ? String(licenseData.expires_at) : null;
          daysLeft = expiresAt ? diffDays(expiresAt) : null;

          if (revoked) status = "revoked";
          else if (expiresAt && typeof daysLeft === "number" && daysLeft < 0) status = "expired";
          else status = "active";
        }

        if (!cancelled) {
          setSubscription({
            status,
            tier_plan: tierPlan,
            license_id: licenseId,
            expires_at: expiresAt,
            days_left: daysLeft,
            max_doctors:
              typeof clinicData?.max_doctors === "number" ? clinicData.max_doctors : null,
            max_assistants:
              typeof clinicData?.max_assistants === "number" ? clinicData.max_assistants : null,
            current_doctors: typeof doctorsCount === "number" ? doctorsCount : null,
            current_assistants: typeof assistantsCount === "number" ? assistantsCount : null,
          });
        }
      } catch {
        if (!cancelled) setSubscription(DEFAULT_SUBSCRIPTION);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [auth.configured, auth.user?.clinic_id, auth.user?.id]);

  const value = useMemo<AppDataValue>(
    () => ({
      clinic,
      isClinicAdmin,
      subscription,
      loading,
      configured: auth.configured,
      runtimeRole: auth.user?.user_type ?? getAppRole(),
      runtimeSpeciality: auth.user?.doctorProfile?.speciality ?? getDoctorSpeciality(),
    }),
    [auth.configured, auth.user?.doctorProfile?.speciality, auth.user?.user_type, clinic, isClinicAdmin, loading, subscription],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppDataProvider>{children}</AppDataProvider>
    </AuthProvider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within Providers");
  return context;
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) throw new Error("useAppData must be used within Providers");
  return context;
}
