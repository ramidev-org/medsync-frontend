// app/contexts/auth_context.tsx
import { User } from "@/models"; // your User model
import { makeRedirectUri } from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";
import React, { createContext, ReactNode, useEffect, useState } from "react";
import { db } from "../database/database_conn"; // Supabase DB handler

type AuthContextType = {
  user: User | null;
  login: (username: string, password: string) => void;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  // Google Auth
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: "YOUR_WEB_CLIENT_ID.apps.googleusercontent.com",
    redirectUri: makeRedirectUri(),
    scopes: ["profile", "email"],
  });

  useEffect(() => {
    if (response?.type === "success") {
      const { authentication } = response;
      fetchUserInfo(authentication?.accessToken);
    }
  }, [response]);

  const fetchUserInfo = async (token?: string) => {
    if (!token) return;
    try {
      const res = await fetch("https://www.googleapis.com/userinfo/v2/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      // Create the User object
      const loggedInUser: User = {
        name: data.name,
        email: data.email,
        role: "",
        save: function (): Promise<any> {
          throw new Error("Function not implemented.");
        },
      };
      setUser(loggedInUser);

      // Check DB for existing user
      const { data: existingUser, error } = await db
        .from("users") // assuming your table is now 'users'
        .select("*")
        .eq("email", data.email)
        .single();

      if (error || !existingUser) {
        // create new user
        const { data: newUser } = await db
          .from("users")
          .insert({ name: data.name, email: data.email, role: "patient" }) // add other fields as needed
          .select()
          .single();
        setUser(newUser as User);
      } else {
        setUser(existingUser as User);
      }
    } catch (e) {
      console.error("Google Auth error:", e);
    }
  };

  const login = (username: string, password: string) => {
    console.log("Login called:", username, password);
    setUser({ name: username, email: "", role: "", save: async () => {} }); // simple placeholder login
  };

  const loginWithGoogle = async () => {
    await promptAsync();
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
