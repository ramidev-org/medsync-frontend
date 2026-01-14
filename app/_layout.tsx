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

  // 🔒 Not authenticated but trying to access drawer
  if (!user && rootSegment === "(drawer)") {
    return <Redirect href="/login" />;
  }

  // ✅ Authenticated but still on login
  if (user && rootSegment === "login") {
    return <Redirect href="/(drawer)" />;
  }

  return null;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <LocalizationProvider>
          <AuthProvider>
            {/* ✅ Auth logic lives here */}
            <AuthGate />

            {/* ✅ Navigator ALWAYS renders on first pass */}
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="login" />
              <Stack.Screen name="(drawer)" />
            </Stack>
          </AuthProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
