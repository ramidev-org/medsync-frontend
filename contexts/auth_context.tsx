// app/contexts/auth_context.tsx
import {
  getAppRole,
  getDoctorSpeciality,
  IS_DEMO,
} from "@/config/runtime";
import { db } from "@/database/database_conn";
import { User } from "@/models/User";
import { makeRedirectUri } from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";
import React, { createContext, useEffect, useRef, useState } from "react";

type SignupPayload = {
  email: string;
  password: string;
  fullName: string;
  licenseKey: string;
  clinicName: string;
  clinicCode?: string;
  state?: string;
  city?: string;
  street?: string;
  googleMapsAddress?: string;
};

type AuthContextType = {
  user: User | null;
  session: any | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signupWithLicense: (payload: SignupPayload) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

// CRITICAL: Move these OUTSIDE the component to survive remounts
let globalLoadedUserId: string | null = null;
let globalAuthListener: any = null;

const buildDemoUser = () => {
  const role = getAppRole();
  const speciality = getDoctorSpeciality();
  return new User({
    id: "demo-user",
    email: "demo@mydoctor.local",
    username: "demo",
    fullname:
      role === "doctor"
        ? "Yasmine Benali"
        : role === "admin"
          ? "Admin Demo"
          : "Assistant Demo",
    role,
    clinic_id: "demo-clinic",
    doctorProfile:
      role === "doctor"
        ? {
            speciality,
            license_number: "DEMO-0001",
            years_of_experience: 6,
            consultation_fee: 2000,
            bio: "Mode démo",
            active: true,
          }
        : null,
    assistantProfile:
      role === "assistant"
        ? {
            department: "Accueil",
            shift_start: "08:00",
            shift_end: "16:00",
            active: true,
          }
        : null,
  });
};

export const AuthProvider = ({ children }: any) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Track if this instance has already initialized
  const hasInitialized = useRef(false);

  // Google login (kept for real mode)
  Google.useAuthRequest({
    clientId: "YOUR_WEB_CLIENT_ID.apps.googleusercontent.com",
    redirectUri: makeRedirectUri(),
    scopes: ["profile", "email"],
  });

  const loadUser = async (id: string) => {
    if (!id || globalLoadedUserId === id) {
      setLoading(false);
      return;
    }
    globalLoadedUserId = id;

    try {
      const { data, error } = await db
        .from("profiles")
        .select(
          `
          *,
          user_roles!user_id ( role ),
          doctor_profiles!id ( * ),
          assistant_profiles!id ( * )
        `,
        )
        .eq("id", id)
        .single();

      if (error || !data) {
        setUser(null);
        await db.auth.signOut();
        globalLoadedUserId = null;
        return;
      }

      setUser(User.fromDb(data));
    } catch {
      setUser(null);
      globalLoadedUserId = null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Demo mode: bypass Supabase completely.
    if (IS_DEMO) {
      setUser(buildDemoUser());
      setSession(null);
      setLoading(false);

      // In some dev setups, changing .env + hot reload can keep module state.
      // Poll lightly to pick up role/speciality changes after refresh.
      const t = setInterval(() => {
        setUser((prev) => {
          const next = buildDemoUser();
          if (!prev) return next;
          if (prev.role !== next.role) return next;
          const prevSpec = (prev as any)?.doctorProfile?.speciality;
          const nextSpec = (next as any)?.doctorProfile?.speciality;
          if (prevSpec !== nextSpec) return next;
          return prev;
        });
      }, 1000);

      return () => clearInterval(t);
    }

    // Prevent duplicate initialization
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    // Clean up any existing listener
    if (globalAuthListener) {
      globalAuthListener.subscription.unsubscribe();
    }

    const setupAuth = async () => {
      // Get initial session
      const {
        data: { session: initialSession },
      } = await db.auth.getSession();

      if (initialSession?.user?.id) {
        setSession(initialSession);
        await loadUser(initialSession.user.id);
      } else {
        setLoading(false);
      }

      // Setup listener
      const { data: listener } = db.auth.onAuthStateChange(
        async (_event, newSession) => {
          setSession(newSession ?? null);

          if (newSession?.user?.id) {
            await loadUser(newSession.user.id);
          } else {
            setUser(null);
            globalLoadedUserId = null;
            setLoading(false);
          }
        },
      );

      globalAuthListener = listener;
    };

    setupAuth();

    // Only cleanup on actual unmount
    return () => {
      // Intentionally do not unsubscribe global listener.
    };
  }, []);

  const signupWithLicense = async (payload: SignupPayload) => {
    if (IS_DEMO) return;
    const res = await fetch(
      "https://cxycroqsgmtasgibapen.functions.supabase.co/signup-with-license",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: payload.email,
          password: payload.password,
          fullName: payload.fullName,
          license_key: payload.licenseKey,
          clinic_name: payload.clinicName,
          clinic_code: payload.clinicCode,
          state: payload.state,
          city: payload.city,
          street: payload.street,
          google_maps_address: payload.googleMapsAddress,
        }),
      },
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Signup failed");
  };

  const login = async (email: string, password: string) => {
    if (IS_DEMO) return;
    const { error } = await db.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const logout = async () => {
    if (IS_DEMO) {
      setUser(null);
      globalLoadedUserId = null;
      return;
    }
    await db.auth.signOut();
    setUser(null);
    globalLoadedUserId = null;
  };

  return (
    <AuthContext.Provider
      value={{ user, session, loading, login, logout, signupWithLicense }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("AuthProvider missing");
  return ctx;
};
