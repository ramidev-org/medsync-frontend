// app/contexts/auth_context.tsx
import { db, SUPABASE_ANON_KEY } from "@/database/database_conn";
import { User } from "@/models/User";
import { getAppRole } from "@/config/runtime";
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
      // Avoid PostgREST embedded selects here because `reception_profiles` is a view
      // (views don't carry FK metadata, so embeds can produce 400s). Load related
      // role/profile rows with targeted follow-up queries instead.
      const { data: profiles, error: profileError } = await db
        .from("profiles")
        .select(
          `
          *,
          user_roles ( role )
        `,
        )
        .eq("id", id)
        .limit(1);

      let profile = profiles?.[0] ?? null;

      // If the profile row doesn't exist yet (common when users are created without the
      // usual "create profile on signup" trigger), try to create a minimal one using
      // the user's own JWT. If RLS disallows it, we'll fall back to a clean sign-out.
      if (!profile && !profileError) {
        const { data: authData } = await db.auth.getUser();
        const email = authData.user?.email ?? "";
        if (email) {
          const base = (email.split("@")[0] || "user").trim();
          const safeBase = base.replace(/[^a-zA-Z0-9_-]/g, "") || "user";
          const username = `${safeBase}-${id.slice(0, 6)}`;

          const { error: insertError } = await db.from("profiles").insert({
            id,
            username,
            full_name: base,
            email,
            active: true,
          });
          if (insertError) {
            throw insertError;
          }

          const retry = await db
            .from("profiles")
            .select(
              `
              *,
              user_roles ( role )
            `,
            )
            .eq("id", id)
            .limit(1);
          if (retry.error) {
            throw retry.error;
          }
          profile = retry.data?.[0] ?? null;
        }
      }

      if (profileError || !profile) {
        setUser(null);
        await db.auth.signOut();
        globalLoadedUserId = null;
        return;
      }

      const rawRole = profile.user_roles?.[0]?.role as string | undefined;
      const role = (rawRole === "assistant" ? "reception" : rawRole) ?? getAppRole();

      let doctorProfile: any = null;
      let receptionProfile: any = null;

      if (role === "doctor") {
        const { data: doctorData } = await db
          .from("doctor_profiles")
          .select("*")
          .eq("id", id)
          .maybeSingle();
        doctorProfile = doctorData ?? null;
      } else if (role === "reception") {
        const { data: receptionData } = await db
          .from("reception_profiles")
          .select("*")
          .eq("id", id)
          .maybeSingle();
        receptionProfile = receptionData ?? null;
      }

      setUser(
        User.fromDb({
          ...profile,
          doctor_profiles: doctorProfile,
          reception_profiles: receptionProfile,
        }),
      );
    } catch {
      setUser(null);
      globalLoadedUserId = null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
    const res = await fetch(
      "https://cxycroqsgmtasgibapen.functions.supabase.co/signup-with-license",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Supabase Functions require an API key even when JWT verification is disabled.
          apikey: SUPABASE_ANON_KEY,
        },
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
    const { error } = await db.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const logout = async () => {
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
