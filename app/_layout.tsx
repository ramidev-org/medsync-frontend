import { AuthProvider } from "@/app/contexts/auth_context";
import { ProfileProvider } from "@/app/contexts/profile_context";
import { LocalizationProvider } from "@/localization/localization_provider";
import { ThemeProvider } from "@/theme/theme_provider";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <LocalizationProvider>
          <AuthProvider>
            <ProfileProvider>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(drawer)" />
                <Stack.Screen name="/login" />
              </Stack>
            </ProfileProvider>
          </AuthProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
