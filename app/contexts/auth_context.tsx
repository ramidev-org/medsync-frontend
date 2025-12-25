import { createContext, ReactNode, useContext, useState } from "react";

type User = {
  name: string;
};

type AuthContextType = {
  user: User | null;
  login: (u: string, p: string) => void;
  loginWithGoogle: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  // EMPTY PLACEHOLDERS
  const login = (u: string, p: string) => {
    console.log(u, p);
    setUser({ name: u });
  };

  const loginWithGoogle = () => {
    setUser({ name: "Google User" });
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth outside provider");
  return ctx;
};
