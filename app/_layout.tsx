import { AppDataProvider } from "@/contexts/appData_context";
import { AuthProvider, useAuth } from "@/contexts/auth_context";
import { LocalizationProvider } from "@/localization/localization_provider";
import { ThemeProvider } from "@/theme/theme_provider";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

function AuthGateWrapper() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Don't navigate while auth is still loading
    if (loading) return;

    const inAuthGroup = segments[0] === "(drawer)";

    if (!user && inAuthGroup) {
      // User is not authenticated but trying to access protected route
      router.replace("/login");
    } else if (user && !inAuthGroup) {
      // User is authenticated but NOT in the drawer group
      // This includes: root index, login, signup
      router.replace("/(drawer)");
    }
  }, [user, segments, loading]);

  // Show loading screen while auth is initializing
  if (loading) {
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

  const stack = (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="(drawer)" />
    </Stack>
  );

  // Mount AppDataProvider ONLY when user exists
  return user ? <AppDataProvider>{stack}</AppDataProvider> : stack;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <LocalizationProvider>
          <AuthProvider>
            <AuthGateWrapper />
          </AuthProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
