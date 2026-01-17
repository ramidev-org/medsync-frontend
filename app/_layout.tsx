// app/_layout.tsx
import { AuthProvider, useAuth } from "@/contexts/auth_context";
import { LocalizationProvider } from "@/localization/localization_provider";
import { ThemeProvider } from "@/theme/theme_provider";
import { Redirect, Stack, useSegments } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";

function AuthGate() {
  const { user } = useAuth();
  const segments = useSegments();
  const rootSegment = segments[0];

  const isPublicRoute =
    rootSegment === undefined || // landing page "/" (_index.tsx)
    rootSegment === "login" ||
    rootSegment === "signup";

  // Redirect authenticated users away from landing/login/signup
  if (user && isPublicRoute) {
    return <Redirect href="/(drawer)" />;
  }

  // Redirect unauthenticated users from protected drawer routes
  if (!user && rootSegment === "(drawer)") {
    return <Redirect href="/" />; // landing page
  }

  return null;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <LocalizationProvider>
          <AuthProvider>
            <AuthGate />

            <Stack screenOptions={{ headerShown: false }}>
              {/* Root landing page */}
              <Stack.Screen name="index" />

              {/* Auth pages */}
              <Stack.Screen name="login" />
              <Stack.Screen name="signup" />

              {/* Authenticated drawer */}
              <Stack.Screen name="(drawer)" />
            </Stack>
          </AuthProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
