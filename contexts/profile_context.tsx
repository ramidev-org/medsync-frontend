// app/contexts/ProfileContext.tsx
import { Profile } from "@/models";
import { createContext, ReactNode, useContext, useState } from "react";

type ProfileContextType = {
  profile: Profile | null;
  setProfile: (profile: Profile) => void;
};

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider = ({ children }: { children: ReactNode }) => {
  const [profile, setProfile] = useState<Profile | null>({
    id: "1",
    role: "dentist",
    fullName: "Rami",
  }); // default for testing

  return (
    <ProfileContext.Provider value={{ profile, setProfile }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used inside ProfileProvider");
  return ctx;
};
