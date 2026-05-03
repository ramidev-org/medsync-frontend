import { APP_ROLE, AppRole } from "@/config/runtime";
import { useAppData } from "@/contexts/appData_context";
import { useAuth } from "@/contexts/auth_context";
import { useTheme } from "@/theme/theme_provider";
import { Fontisto, Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { DrawerContentScrollView, DrawerItem } from "@react-navigation/drawer";
import { useRouter } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { useEffect, useMemo, useState, type ReactElement } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";

type AppRoute =
  | "/dashboard"
  | "/calendar"
  | "/patients"
  | "/visits"
  | "/consultations"
  | "/dentistry-workspace"
  | "/dermatology-workspace"
  | "/orthopedics-workspace"
  | "/payments"
  | "/services"
  | "/reports"
  | "/tasks"
  | "/inventory"
  | "/users"
  | "/settings"
  | "/profile";

type NavItem = {
  key: string;
  label: string;
  route: AppRoute;
  icon: (opts: { color: string; size: number }) => ReactElement;
  visible?: (ctx: { role: AppRole; isClinicAdmin: boolean }) => boolean;
};

const NAV: NavItem[] = [
  { key: "dashboard", label: "Dashboard", route: "/dashboard", icon: ({ color, size }) => <MaterialIcons name="space-dashboard" size={size} color={color} /> },
  { key: "calendar", label: "Calendar", route: "/calendar", icon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} /> },
  { key: "patients", label: "Patients", route: "/patients", icon: ({ color, size }) => <MaterialIcons name="personal-injury" size={size} color={color} /> },
  { key: "visits", label: "Visits", route: "/visits", icon: ({ color, size }) => <Ionicons name="clipboard-outline" size={size} color={color} /> },
  { key: "consultations", label: "Consultations", route: "/consultations", icon: ({ color, size }) => <Ionicons name="document-text-outline" size={size} color={color} /> },
  { key: "dentistry_workspace", label: "Dentistry (Test)", route: "/dentistry-workspace", icon: ({ color, size }) => <MaterialCommunityIcons name="tooth-outline" size={size} color={color} /> },
  { key: "dermatology_workspace", label: "Dermatology (Test)", route: "/dermatology-workspace", icon: ({ color, size }) => <MaterialCommunityIcons name="face-man-outline" size={size} color={color} /> },
  { key: "orthopedics_workspace", label: "Orthopedics (Test)", route: "/orthopedics-workspace", icon: ({ color, size }) => <MaterialCommunityIcons name="bone" size={size} color={color} /> },
  { key: "services", label: "Services", route: "/services", visible: ({ role }) => role === "doctor", icon: ({ color, size }) => <Ionicons name="pricetag-outline" size={size} color={color} /> },
  { key: "reports", label: "Reports", route: "/reports", icon: ({ color, size }) => <Ionicons name="bar-chart-outline" size={size} color={color} /> },
  { key: "tasks", label: "Tasks", route: "/tasks", icon: ({ color, size }) => <Ionicons name="checkbox-outline" size={size} color={color} /> },
  { key: "inventory", label: "Inventory", route: "/inventory", icon: ({ color, size }) => <Ionicons name="cube-outline" size={size} color={color} /> },
  { key: "payments", label: "Billing", route: "/payments", visible: ({ role, isClinicAdmin }) => role === "assistant" || (role === "doctor" && isClinicAdmin), icon: ({ color, size }) => <Ionicons name="card-outline" size={size} color={color} /> },
  { key: "users", label: "Team", route: "/users", visible: ({ role, isClinicAdmin }) => role === "doctor" && isClinicAdmin, icon: ({ color, size }) => <Fontisto name="persons" size={size} color={color} /> },
  { key: "settings", label: "Settings", route: "/settings", icon: ({ color, size }) => <MaterialCommunityIcons name="cog-outline" size={size} color={color} /> },
  { key: "profile", label: "Profile", route: "/profile", icon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} /> },
];

export default function Layout() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { isClinicAdmin, clinic } = useAppData();
  const { width } = useWindowDimensions();
  const role = (((user?.user_type as any) || APP_ROLE) === "reception" ? "assistant" : ((user?.user_type as any) || APP_ROLE)) as AppRole;
  const [expanded, setExpanded] = useState(true);
  const drawerWidth = expanded ? 252 : 88;

  useEffect(() => {
    if (Platform.OS !== "web") return;
    setExpanded(width >= 1260);
  }, [width]);

  return (
    <Drawer
      screenOptions={{
        headerShown: false,
        drawerType: "permanent",
        swipeEnabled: false,
        drawerStyle: { backgroundColor: theme.colors.surface, width: drawerWidth, borderRightWidth: 1, borderRightColor: theme.colors.border, ...(Platform.OS === "web" ? ({ boxShadow: "0px 12px 28px rgba(15,23,42,0.06)" } as any) : null) },
      }}
      drawerContent={(props) => (
        <CustomDrawerContent {...props} expanded={expanded} setExpanded={setExpanded} role={role} isClinicAdmin={isClinicAdmin} clinicName={clinic?.name || "MyDoctor"} userName={user?.fullname || user?.email || "User"} theme={theme} />
      )}
    >
      <Drawer.Screen name="dashboard/index" options={{ drawerLabel: "Dashboard" }} />
      <Drawer.Screen name="calendar" options={{ drawerLabel: "Calendar" }} />
      <Drawer.Screen name="patients" options={{ drawerLabel: "Patients" }} />
      <Drawer.Screen name="visits" options={{ drawerLabel: "Visits" }} />
      <Drawer.Screen name="consultations" options={{ drawerLabel: "Consultations" }} />
      <Drawer.Screen name="dentistry-workspace" options={{ drawerLabel: "Dentistry (Test)" }} />
      <Drawer.Screen name="dermatology-workspace" options={{ drawerLabel: "Dermatology (Test)" }} />
      <Drawer.Screen name="orthopedics-workspace" options={{ drawerLabel: "Orthopedics (Test)" }} />
      <Drawer.Screen name="payments" options={{ drawerLabel: "Billing" }} />
      <Drawer.Screen name="services" options={{ drawerLabel: "Services" }} />
      <Drawer.Screen name="reports" options={{ drawerLabel: "Reports" }} />
      <Drawer.Screen name="tasks" options={{ drawerLabel: "Tasks" }} />
      <Drawer.Screen name="inventory" options={{ drawerLabel: "Inventory" }} />
      <Drawer.Screen name="users" options={{ drawerLabel: "Team" }} />
      <Drawer.Screen name="settings" options={{ drawerLabel: "Settings" }} />
      <Drawer.Screen name="profile" options={{ drawerLabel: "Profile" }} />
      <Drawer.Screen name="chats" options={{ drawerLabel: "Chats" }} />
      <Drawer.Screen name="imaging-tools" options={{ drawerLabel: "Imaging Tools" }} />
      <Drawer.Screen name="patient_medical_info" options={{ drawerItemStyle: { display: "none" } }} />
      <Drawer.Screen name="consultation/index" options={{ drawerItemStyle: { display: "none" } }} />
    </Drawer>
  );
}

function CustomDrawerContent({ expanded, setExpanded, theme, state, role, isClinicAdmin, clinicName, userName }: any) {
  const router = useRouter();
  const currentRoute: string = state?.routes?.[state?.index]?.name ?? "";
  const items = NAV.filter((item) => (item.visible ? item.visible({ role, isClinicAdmin }) : true));
  const activeColor = theme.colors.primary;
  const inactiveColor = theme.colors.textSecondary;

  return (
    <DrawerContentScrollView contentContainerStyle={{ flex: 1, paddingTop: 16, paddingHorizontal: 10 }}>
      <View style={{ paddingHorizontal: expanded ? 10 : 6, marginBottom: 14 }}>
        {expanded && (
          <>
            <Text numberOfLines={1} style={{ fontWeight: "900", fontSize: 16, color: theme.colors.text }}>{clinicName}</Text>
            <Text numberOfLines={1} style={{ marginTop: 2, fontWeight: "700", color: theme.colors.textSecondary }}>{userName}</Text>
          </>
        )}
      </View>
      <View style={{ paddingHorizontal: expanded ? 10 : 6, marginBottom: 10 }}>
        <TouchableOpacity onPress={() => setExpanded(!expanded)} style={{ width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.border }}>
          <Ionicons name="menu" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>
      {items.map((item) => {
        const routeName = item.route.replace(/^\//, "");
        const active = currentRoute === routeName || currentRoute.startsWith(routeName + "/");
        const tint = active ? activeColor : inactiveColor;
        return (
          <View key={item.key} style={{ borderRadius: 14, overflow: "hidden", marginBottom: 6, backgroundColor: active ? theme.colors.primarySoft : "transparent" }}>
            <DrawerItem
              label={expanded ? item.label : ""}
              labelStyle={{ marginLeft: expanded ? -10 : -999, fontSize: 14, fontWeight: active ? "800" : "600", color: tint }}
              icon={() => item.icon({ color: tint, size: 21 })}
              onPress={() => router.push(item.route)}
              style={styles.drawerItem}
            />
          </View>
        );
      })}
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  drawerItem: { borderRadius: 14 },
});
