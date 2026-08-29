import "@/theme/global_typography";
import { AppDataProvider, useAppData } from "@/contexts/appData_context";
import { AuthProvider, useAuth } from "@/contexts/auth_context";
import { TasksProvider } from "@/contexts/tasks_context";
import { OfflineSyncProvider } from "@/contexts/offline_sync_context";
import { ErrorBoundary } from "@/components/common/error_boundary";
import { ThemeProvider } from "@/theme/theme_provider";
import { ToastProvider } from "@/contexts/toast_context";
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
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { Platform } from "react-native";
import { AnimatedLoading } from "@/components/common/animated_loading";

const DEV_SUBSCRIPTION_BYPASS = typeof __DEV__ !== "undefined" && __DEV__;

function AuthGateWrapper() {
  const { user, loading } = useAuth();
  const { subscription, loading: appDataLoading } = useAppData();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading || (!!user && appDataLoading)) return;

    if (Platform.OS === "web" && typeof window !== "undefined") {
      const lockedCallUrl = window.sessionStorage.getItem("medsync_call_lock_url") || "";
      const currentUrl = `${window.location.pathname}${window.location.search}`;
      if (lockedCallUrl && currentUrl !== lockedCallUrl) {
        router.replace(lockedCallUrl as any);
        return;
      }
    }

    const inDrawerGroup = segments[0] === "(drawer)";
    const inCallScreen = segments[0] === "call";
    const inSubscriptionScreen =
      segments[0] === "(drawer)" && segments[1] === "settings-subscription";
    const inAuthScreen =
      segments[0] === "login" ||
      segments[0] === "signup" ||
      segments[0] === "activate-clinic" ||
      segments[0] === "accept-invite" ||
      segments[0] === "invite";

    if (!user && (inDrawerGroup || inCallScreen)) {
      router.replace("/login");
      return;
    }

    const subscriptionBlocked =
      !DEV_SUBSCRIPTION_BYPASS &&
      (subscription.status === "expired" || subscription.status === "revoked");

    if (user && subscriptionBlocked && !inSubscriptionScreen) {
      router.replace("/settings-subscription");
      return;
    }

    if (user && (!inDrawerGroup && !inCallScreen && !inAuthScreen)) {
      router.replace("/dashboard");
      return;
    }

    if (user && inAuthScreen) {
      router.replace("/dashboard");
      return;
    }
  }, [user, segments, loading, appDataLoading, subscription.status, router]);

  if (loading || (!!user && appDataLoading)) {
    return <AnimatedLoading label="Loading..." />;
  }

  const stack = (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="activate-clinic" />
      <Stack.Screen name="accept-invite" />
      <Stack.Screen name="invite/[token]" />
      <Stack.Screen name="call/[sessionId]" />
      <Stack.Screen name="(drawer)" />
    </Stack>
  );

  return (
    <OfflineSyncProvider>
      <TasksProvider>{stack}</TasksProvider>
    </OfflineSyncProvider>
  );
}

export default function RootLayout() {
  // ✅ LOAD ICON FONTS HERE (fixes □ icons on Vercel)
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    ...Ionicons.font,
    ...MaterialIcons.font,
    ...MaterialCommunityIcons.font,
    ...FontAwesome5.font,
    ...FontAwesome6.font,
    ...Fontisto.font,
  });

  // ✅ block rendering until fonts loaded
  if (!fontsLoaded) {
    return <AnimatedLoading />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <AppDataProvider>
                <AuthGateWrapper />
              </AppDataProvider>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
