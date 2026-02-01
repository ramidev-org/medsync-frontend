// app/contexts/auth_context.tsx
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

export const AuthProvider = ({ children }: any) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Track if this instance has already initialized
  const hasInitialized = useRef(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: "YOUR_WEB_CLIENT_ID.apps.googleusercontent.com",
    redirectUri: makeRedirectUri(),
    scopes: ["profile", "email"],
  });

  const loadUser = async (id: string) => {
    if (!id || globalLoadedUserId === id) {
      console.log("⏭️ Skipping duplicate load for user:", id);
      setLoading(false);
      return;
    }

    console.log("🔄 Loading user profile:", id);
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
        console.error("❌ Failed to load user:", error);
        setUser(null);
        await db.auth.signOut();
        globalLoadedUserId = null;
        return;
      }

      setUser(User.fromDb(data));
      console.log("✅ User profile loaded successfully");
    } catch (err) {
      console.error("❌ Error loading user:", err);
      setUser(null);
      globalLoadedUserId = null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Prevent duplicate initialization
    if (hasInitialized.current) {
      console.log("⚠️ AuthProvider already initialized, skipping");
      return;
    }

    console.log("🔐 Setting up auth listener");
    hasInitialized.current = true;

    // Clean up any existing listener
    if (globalAuthListener) {
      console.log("🧹 Cleaning up old listener");
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
        async (event, newSession) => {
          console.log("🔔 Auth state changed:", event);
          setSession(newSession ?? null);

          if (newSession?.user?.id) {
            await loadUser(newSession.user.id);
          } else {
            console.log("👋 No session, clearing user");
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
      console.log("🧹 Cleaning up auth listener");
      // DO NOT unsubscribe here - let the global listener persist
    };
  }, []); // Empty deps - only run once

  const signupWithLicense = async (payload: SignupPayload) => {
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
    const { error } = await db.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const logout = async () => {
    await db.auth.signOut();
    setUser(null);
    globalLoadedUserId = null;
  };

  // ❌ REMOVE THIS LOADING SCREEN - let AuthGateWrapper handle it
  // if (loading) {
  //   return (
  //     <div
  //       style={{
  //         width: "100vw",
  //         height: "100vh",
  //         display: "flex",
  //         justifyContent: "center",
  //         alignItems: "center",
  //       }}
  //     >
  //       <p>Loading...</p>
  //     </div>
  //   );
  // }

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
