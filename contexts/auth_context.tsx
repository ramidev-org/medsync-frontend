// app/contexts/auth_context.tsx
import { db } from "@/database/database_conn";
import { User } from "@/models/User";
import { makeRedirectUri } from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";
import * as React from "react";
import { createContext, useEffect, useState } from "react";

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
  login: (email: string, password: string) => Promise<void>;
  signupWithLicense: (payload: SignupPayload) => Promise<void>;
  logout: () => Promise<void>;
};


const AuthContext = createContext<AuthContextType | null>(null);
export const AuthProvider = ({ children }: any) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any | null>(null);


  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: "YOUR_WEB_CLIENT_ID.apps.googleusercontent.com",
    redirectUri: makeRedirectUri(), // important for web + mobile
    scopes: ["profile", "email"],
  });

  // Load session on mount
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await db.auth.getSession();

        if (error) {
          console.error("Error getting session:", error);
        }

        if (session && mounted) {
          setSession(session);
          await loadUser(session.user.id);
        }
      } catch (err) {
        console.error("Error checking session:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    const { data: listener } = db.auth.onAuthStateChange((_event, session) => {
      setSession(session ?? null);

      if (session?.user) {
        loadUser(session.user.id).finally(() => setLoading(false));
      } else {
        setUser(null);
        setLoading(false);
      }
    });


    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const loadUser = async (id: string) => {
    try {
      const { data, error } = await db
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        await db.auth.signOut();
        setUser(null);
      } else {
        setUser(User.fromDb(data));
      }
    } catch (err) {
      console.error("Error loading user:", err);
      setUser(null);
    }
  };

  const signupWithLicense = async ({
    email,
    password,
    fullName,
    licenseKey,
    clinicName,
    clinicCode,
    state,
    city,
    street,
    googleMapsAddress,
  }: SignupPayload) => {
    const res = await fetch(
      "https://cxycroqsgmtasgibapen.functions.supabase.co/signup-with-license",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          fullName,
          license_key: licenseKey,
          clinic_name: clinicName,
          clinic_code: clinicCode,
          state,
          city,
          street,
          google_maps_address: googleMapsAddress,
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Signup failed");
    }

    /**
     * Edge function already:
     * - created auth user
     * - created profile
     * - assigned roles
     * - consumed license
     */


  };


  const login = async (email: string, password: string) => {
    const { data, error } = await db.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    if (data?.user) await loadUser(data.user.id);
  };

  const logout = async () => {
    await db.auth.signOut();
    setUser(null);
  };

  if (loading) {
    // show a minimal splash instead of white screen
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, session, login, logout, signupWithLicense }}>
      {children}
    </AuthContext.Provider>

  );
};

export const useAuth = () => {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("AuthProvider missing");
  return ctx;
};
