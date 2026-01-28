// app/home.tsx
import HomeAdmin from "@/app/(drawer)/home_admin";
import HomeClinic from "@/app/(drawer)/home_clinic";
import { useAuth } from "@/contexts/auth_context";
import { Text } from "react-native";

export default function Home() {
  const { user } = useAuth();

  console.log("User in Home:", user);

  if (!user) return <Text>Loading...</Text>;

  if (user.role === "admin") {
    return <HomeAdmin />;
  }

  return <HomeClinic virtualClinicId={user.id!} />;
}
