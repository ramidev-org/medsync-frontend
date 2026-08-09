// app/contexts/auth_context.tsx
import { db } from "@/database/database_conn";
import { User } from "@/models/User";
import { makeRedirectUri } from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";
import React, { createContext, useEffect, useRef, useState } from "react";

type AuthContextType = {
  user: User | null;
  session: any | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
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
      const { data: meta, error: metaError } = await db
        .from("users_metadata")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (metaError || !meta) {
        setUser(null);
        await db.auth.signOut();
        globalLoadedUserId = null;
        return;
      }

      let doctorProfile: any = null;
      let assistantProfile: any = null;

      const userType =
        String(meta.user_type ?? "").toLowerCase() === "doctor"
          ? "doctor"
          : "assistant";

      if (userType === "doctor") {
        const { data: doctorData } = await db
          .from("doctor_profiles")
          .select("*")
          .eq("id", id)
          .maybeSingle();
        doctorProfile = doctorData ?? null;
      } else {
        const { data: assistantData } = await db
          .from("assistant_profiles")
          .select("*")
          .eq("id", id)
          .maybeSingle();
        assistantProfile = assistantData ?? null;
      }

      setUser(
        User.fromDb({
          ...meta,
          doctor_profiles: doctorProfile,
          assistant_profiles: assistantProfile,
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

  const login = async (email: string, password: string) => {
    const { error } = await db.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const logout = async () => {
    await db.auth.signOut();
    setUser(null);
    globalLoadedUserId = null;
  };

  const refreshUser = async () => {
    const sessionUserId = session?.user?.id;
    if (!sessionUserId) return;
    globalLoadedUserId = null;
    setLoading(true);
    await loadUser(sessionUserId);
  };

  return (
    <AuthContext.Provider
      value={{ user, session, loading, login, logout, refreshUser }}
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
