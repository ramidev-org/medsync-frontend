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
  const isAuthRoute =
    rootSegment === "login" || rootSegment === "signup";

  if (!user && rootSegment === "(drawer)") {
    return <Redirect href="/login" />;
  }

  if (user && isAuthRoute) {
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
            <AuthGate />

            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="login" />
              <Stack.Screen name="signup" />
              <Stack.Screen name="(drawer)" />
            </Stack>
          </AuthProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
