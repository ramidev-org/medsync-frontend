import { APP_ROLE, AppRole } from "@/config/runtime";
import { useAuth } from "@/contexts/auth_context";
import { useAppData } from "@/contexts/appData_context";
import { useTheme } from "@/theme/theme_provider";
import {
  Fontisto,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { DrawerContentScrollView, DrawerItem } from "@react-navigation/drawer";
import { useRouter } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { useMemo, useState, type ReactElement } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

type AppRoute =
  | "/dashboard"
  | "/visits"
  | "/patients"
  | "/payments"
  | "/chats"
  | "/users"
  | "/profile";

type NavItem = {
  key: string;
  label: string;
  icon: (opts: { active: boolean; color: string; size: number }) => ReactElement;
  route: AppRoute;
  visible?: (ctx: { role: AppRole; isClinicAdmin: boolean }) => boolean;
};

export default function Layout() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { isClinicAdmin } = useAppData();
  const styles = useMemo(() => getStyles(theme), [theme]);

  // Prefer authenticated user's role (demo or real). Fallback to env role.
  const rawRole = (user?.user_type as any) || APP_ROLE;
  const role: AppRole = (rawRole === "reception" ? "assistant" : rawRole) as AppRole;

  const [expanded, setExpanded] = useState(true);
  const drawerWidth = expanded ? 240 : 86;

  const iconSize = 22;

  return (
    <Drawer
      screenOptions={{
        headerShown: false,
        drawerType: "permanent",
        swipeEnabled: false,
        drawerStyle: {
          backgroundColor: theme.colors.surface,
          width: drawerWidth,
          borderRightWidth: 1,
          borderRightColor: theme.colors.border,
        },
        // We will control icon + label colors ourselves
        drawerActiveTintColor: theme.colors.primary,
        drawerInactiveTintColor: theme.colors.textSecondary,
        drawerLabelStyle: {
          ...styles.label,
          display: expanded ? "flex" : "none",
        },
      }}
      drawerContent={(props) => (
        <CustomDrawerContent
          {...props}
          expanded={expanded}
          setExpanded={setExpanded}
          theme={theme}
          iconSize={iconSize}
          role={role}
          isClinicAdmin={isClinicAdmin}
        />
      )}
    >
      {/* Screens must exist for routing */}
      <Drawer.Screen name="dashboard/index" options={{ drawerLabel: "Dashboard" }} />
      <Drawer.Screen name="visits" options={{ drawerLabel: "Visites" }} />
      <Drawer.Screen name="patients" options={{ drawerLabel: "Patients" }} />
      <Drawer.Screen name="payments" options={{ drawerLabel: "Paiements" }} />
      <Drawer.Screen name="chats" options={{ drawerLabel: "Chats" }} />
      <Drawer.Screen name="users" options={{ drawerLabel: "Utilisateurs" }} />
      <Drawer.Screen name="profile" options={{ drawerLabel: "Profil" }} />
    </Drawer>
  );
}

const NAV: NavItem[] = [
  {
    key: "dashboard",
    label: "Accueil",
    route: "/dashboard",
    icon: ({ color, size }) => (
      <MaterialIcons name="space-dashboard" size={size} color={color} />
    ),
  },
  {
    key: "visits",
    label: "Visites",
    route: "/visits",
    icon: ({ color, size }) => (
      <Ionicons name="calendar-outline" size={size} color={color} />
    ),
  },
  {
    key: "patients",
    label: "Patients",
    route: "/patients",
    icon: ({ color, size }) => (
      <MaterialIcons name="personal-injury" size={size} color={color} />
    ),
  },
  {
    key: "payments",
    label: "Paiements",
    route: "/payments",
    visible: ({ role, isClinicAdmin }) =>
      role === "assistant" || (role === "doctor" && isClinicAdmin),
    icon: ({ color, size }) => (
      <Ionicons name="card-outline" size={size} color={color} />
    ),
  },
  {
    key: "chats",
    label: "Chats",
    route: "/chats",
    icon: ({ color, size }) => (
      <Ionicons
        name="chatbubble-ellipses-outline"
        size={size}
        color={color}
      />
    ),
  },
  {
    key: "users",
    label: "Utilisateurs",
    route: "/users",
    visible: ({ role, isClinicAdmin }) => role === "doctor" && isClinicAdmin,
    icon: ({ color, size }) => <Fontisto name="persons" size={size} color={color} />,
  },
  {
    key: "settings",
    label: "Paramètres",
    route: "/profile",
    icon: ({ color, size }) => (
      <MaterialCommunityIcons name="cog-outline" size={size} color={color} />
    ),
  },
];

function CustomDrawerContent({
  expanded,
  setExpanded,
  theme,
  state,
  iconSize,
  role,
  isClinicAdmin,
}: any) {
  const router = useRouter();
  const styles = getStyles(theme);

  // React Navigation route name may be "dashboard" or "dashboard/index" or "dashboard/something"
  const currentRoute: string = state?.routes?.[state?.index]?.name ?? "";

  const items = NAV.filter((i) => (i.visible ? i.visible({ role, isClinicAdmin }) : true));

  const isActiveRoute = (route: AppRoute) => {
    const routeName = route.replace(/^\//, "");
    // keep dashboard highlighted for nested routes
    return currentRoute === routeName || currentRoute.startsWith(routeName + "/");
  };

  return (
    <DrawerContentScrollView
      contentContainerStyle={{
        flex: 1,
        paddingTop: 14,
        paddingHorizontal: 10,
      }}
    >
      <View style={{ paddingHorizontal: expanded ? 10 : 6, marginBottom: 10 }}>
        <TouchableOpacity
          onPress={() => setExpanded(!expanded)}
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: theme.colors.background,
            borderWidth: 1,
            borderColor: theme.colors.border,
          }}
        >
          <Ionicons name="menu" size={22} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {items.map((item) => {
        const active = isActiveRoute(item.route);

        const tint = active ? theme.colors.primary : theme.colors.textSecondary;

        return (
          <View
            key={item.key}
            style={{
              borderRadius: 14,
              overflow: "hidden",
              marginBottom: 6,
              backgroundColor: active ? "#EFF6FF" : "transparent",
            }}
          >
            <DrawerItem
              label={item.label}
              labelStyle={{
                fontSize: 14,
                fontWeight: active ? "700" : "500",
                color: tint,
              }}
              // ✅ Force icon color to match label tint
              icon={() => item.icon({ active, color: tint, size: iconSize })}
              // ✅ Always push absolute URL; fixes "Dashboard not clickable"
              onPress={() => router.push(item.route)}
              style={styles.drawerItem}
            />
          </View>
        );
      })}
    </DrawerContentScrollView>
  );
}

const getStyles = (_theme: any) =>
  StyleSheet.create({
    label: {
      marginLeft: -10,
    },
    drawerItem: {
      borderRadius: 14,
    },
  });
