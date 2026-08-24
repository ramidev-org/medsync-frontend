import { APP_ROLE, AppRole } from "@/config/runtime";
import { useAppData } from "@/contexts/appData_context";
import { useAuth } from "@/contexts/auth_context";
import { useTheme } from "@/theme/theme_provider";
import { Fontisto, Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { DrawerContentScrollView, DrawerItem } from "@react-navigation/drawer";
import { useRouter } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { useEffect, useState, type ReactElement } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";

type AppRoute = string;
type NavSection = "main" | "management" | "tools" | "account";
type NavItem = {
  key: string;
  label: string;
  route: AppRoute;
  section: NavSection;
  icon: (opts: { color: string; size: number }) => ReactElement;
  visible?: (ctx: { role: AppRole; isClinicAdmin: boolean }) => boolean;
};

const NAV: NavItem[] = [
  { key: "dashboard", label: "Dashboard", route: "/dashboard", section: "main", icon: ({ color, size }) => <MaterialIcons name="space-dashboard" size={size} color={color} /> },
  { key: "calendar", label: "Calendar", route: "/calendar", section: "main", icon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} /> },
  { key: "patients", label: "Patients", route: "/patients", section: "main", icon: ({ color, size }) => <MaterialIcons name="personal-injury" size={size} color={color} /> },
  { key: "visits", label: "Visits", route: "/visits", section: "main", icon: ({ color, size }) => <Ionicons name="clipboard-outline" size={size} color={color} /> },
  { key: "consultations", label: "Consultations", route: "/consultations", section: "main", icon: ({ color, size }) => <Ionicons name="document-text-outline" size={size} color={color} /> },
  { key: "medical_analyses_workspace", label: "Analyses medicales", route: "/analyses-medicales-workspace", section: "main", icon: ({ color, size }) => <MaterialCommunityIcons name="flask-outline" size={size} color={color} /> },

  { key: "payments", label: "Billing", route: "/payments", section: "management", icon: ({ color, size }) => <Ionicons name="card-outline" size={size} color={color} /> },
  { key: "reports", label: "Reports", route: "/reports", section: "management", icon: ({ color, size }) => <Ionicons name="bar-chart-outline" size={size} color={color} /> },
  { key: "statistiques", label: "Statistiques", route: "/statistiques", section: "management", icon: ({ color, size }) => <Ionicons name="stats-chart-outline" size={size} color={color} /> },
  { key: "tasks", label: "Tasks", route: "/tasks", section: "management", icon: ({ color, size }) => <Ionicons name="checkbox-outline" size={size} color={color} /> },
  { key: "inventory", label: "Inventory", route: "/inventory", section: "management", icon: ({ color, size }) => <Ionicons name="cube-outline" size={size} color={color} /> },
  { key: "users", label: "Team", route: "/users", section: "management", visible: ({ role, isClinicAdmin }) => role === "doctor" && isClinicAdmin, icon: ({ color, size }) => <Fontisto name="persons" size={size} color={color} /> },

  { key: "chats", label: "Chats", route: "/chats", section: "tools", icon: ({ color, size }) => <Ionicons name="chatbubbles-outline" size={size} color={color} /> },

  { key: "settings", label: "Settings", route: "/settings", section: "account", icon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} /> },
];

export default function Layout() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { isClinicAdmin, clinic } = useAppData();
  const { width } = useWindowDimensions();
  const role = (((user?.user_type as any) || APP_ROLE) === "reception" ? "assistant" : ((user?.user_type as any) || APP_ROLE)) as AppRole;
  const [expanded, setExpanded] = useState(true);
  const drawerWidth = expanded ? 220 : 88;

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
      <Drawer.Screen name="analyses-medicales-workspace" options={{ drawerLabel: "Analyses medicales" }} />
      <Drawer.Screen name="payments" options={{ drawerLabel: "Billing" }} />
      <Drawer.Screen name="reports" options={{ drawerLabel: "Reports" }} />
      <Drawer.Screen name="statistiques" options={{ drawerLabel: "Statistiques" }} />
      <Drawer.Screen name="tasks" options={{ drawerLabel: "Tasks" }} />
      <Drawer.Screen name="inventory" options={{ drawerLabel: "Inventory" }} />
      <Drawer.Screen name="users" options={{ drawerLabel: "Team" }} />
      <Drawer.Screen name="settings" options={{ drawerLabel: "Settings" }} />
      <Drawer.Screen name="profile" options={{ drawerLabel: "Profile" }} />
      <Drawer.Screen name="chats" options={{ drawerLabel: "Chats" }} />
      <Drawer.Screen name="notifications" options={{ drawerLabel: "Notifications" }} />
      <Drawer.Screen name="settings-practice" options={{ drawerItemStyle: { display: "none" } }} />
      <Drawer.Screen name="settings-subscription" options={{ drawerItemStyle: { display: "none" } }} />
      <Drawer.Screen name="settings-security" options={{ drawerItemStyle: { display: "none" } }} />
      <Drawer.Screen name="settings-data" options={{ drawerItemStyle: { display: "none" } }} />
      <Drawer.Screen name="patient_medical_info" options={{ drawerItemStyle: { display: "none" } }} />
      <Drawer.Screen name="consultation/index" options={{ drawerItemStyle: { display: "none" } }} />
      <Drawer.Screen name="consultation-module/[id]/[module]" options={{ drawerItemStyle: { display: "none" } }} />
    </Drawer>
  );
}

function CustomDrawerContent({ expanded, setExpanded, theme, state, role, isClinicAdmin, clinicName, userName }: any) {
  const router = useRouter();
  const currentRoute: string = state?.routes?.[state?.index]?.name ?? "";
  const items = NAV.filter((item) => (item.visible ? item.visible({ role, isClinicAdmin }) : true));
  const activeColor = theme.colors.primary;
  const inactiveColor = theme.colors.textSecondary;
  const sectionOrder: NavSection[] = ["main", "management", "tools", "account"];
  const sectionLabels: Record<NavSection, string> = {
    main: "Main",
    management: "Management",
    tools: "Tools",
    account: "Account",
  };

  return (
    <DrawerContentScrollView contentContainerStyle={{ flex: 1, paddingTop: 16, paddingHorizontal: 10 }}>
      <View style={{ paddingHorizontal: expanded ? 10 : 6, marginBottom: 14 }}>
        {expanded && (
          <>
            <Text numberOfLines={1} style={{ fontWeight: "700", fontSize: 16, color: theme.colors.text }}>{clinicName}</Text>
            <Text numberOfLines={1} style={{ marginTop: 2, fontWeight: "700", color: theme.colors.textSecondary }}>{userName}</Text>
          </>
        )}
      </View>
      <View style={{ paddingHorizontal: expanded ? 10 : 6, marginBottom: 10 }}>
        <TouchableOpacity onPress={() => setExpanded(!expanded)} style={{ width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.border }}>
          <Ionicons name="menu" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>
      {sectionOrder.map((section) => {
        const sectionItems = items.filter((item) => item.section === section);
        if (sectionItems.length === 0) return null;

        return (
          <View key={section} style={{ marginTop: section === "main" ? 2 : 10 }}>
            {expanded && <Text style={styles.sectionTitle}>{sectionLabels[section]}</Text>}
            {sectionItems.map((item) => {
              const routeName = item.route.replace(/^\//, "");
              const active = currentRoute === routeName || currentRoute.startsWith(routeName + "/");
              const tint = active ? activeColor : inactiveColor;
              return (
                <View key={item.key} style={{ borderRadius: 14, overflow: "hidden", marginBottom: 6, backgroundColor: active ? theme.colors.primarySoft : "transparent" }}>
                  <DrawerItem
                    label={expanded ? item.label : ""}
                    labelStyle={{ marginLeft: expanded ? -10 : -999, fontSize: 14, fontWeight: active ? "600" : "500", color: tint }}
                    icon={() => item.icon({ color: tint, size: 21 })}
                    onPress={() => router.push(item.route as any)}
                    style={styles.drawerItem}
                  />
                </View>
              );
            })}
          </View>
        );
      })}
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  drawerItem: { borderRadius: 14 },
  sectionTitle: { marginBottom: 6, marginTop: 4, paddingHorizontal: 10, fontSize: 12, fontWeight: "700", opacity: 0.7 },
});
