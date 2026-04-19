import { getIsDemo } from "@/config/runtime";
import { AppDataProvider } from "@/contexts/appData_context";
import { AuthProvider, useAuth } from "@/contexts/auth_context";
import { LocalizationProvider } from "@/localization/localization_provider";
import { ThemeProvider } from "@/theme/theme_provider";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// ✅ ADD THESE
import {
  FontAwesome5,
  FontAwesome6,
  Fontisto,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { ActivityIndicator, View } from "react-native";

function AuthGateWrapper() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const isDemo = getIsDemo();
    const inDrawerGroup = segments[0] === "(drawer)";
    const inAuthScreen = segments[0] === "login" || segments[0] === "signup";

    // ✅ If not signed in (and not demo), block protected drawer screens
    if (!user && !isDemo && inDrawerGroup) {
      router.replace("/login");
      return;
    }

    // ✅ If signed in OR demo, keep user inside drawer routes
    // IMPORTANT: redirect to a REAL URL, not "/(drawer)"
    if ((user || isDemo) && (!inDrawerGroup && !inAuthScreen)) {
      router.replace("/dashboard");
      return;
    }

    // ✅ If signed in OR demo and they are on login/signup, send them to dashboard
    if ((user || isDemo) && inAuthScreen) {
      router.replace("/dashboard");
      return;
    }
  }, [user, segments, loading, router]);

  // Web-friendly loading UI
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

  // Demo counts as session
  return user || getIsDemo() ? <AppDataProvider>{stack}</AppDataProvider> : stack;
}

export default function RootLayout() {
  // ✅ LOAD ICON FONTS HERE (fixes □ icons on Vercel)
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
    ...MaterialIcons.font,
    ...MaterialCommunityIcons.font,
    ...FontAwesome5.font,
    ...FontAwesome6.font,
    ...Fontisto.font,
  });

  // ✅ block rendering until fonts loaded
  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

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
