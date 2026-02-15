import { APP_ROLE, AppRole } from "@/config/runtime";
import { useAuth } from "@/contexts/auth_context";
import { useTheme } from "@/theme/theme_provider";
import {
  Fontisto,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { DrawerContentScrollView, DrawerItem } from "@react-navigation/drawer";
import { Drawer } from "expo-router/drawer";
import { useMemo, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

type NavItem = {
  key: string;
  label: string;
  icon: (opts: { active: boolean; color: string; size: number }) => JSX.Element;
  route: string;
  roles?: AppRole[];
};

export default function Layout() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const styles = useMemo(() => getStyles(theme), [theme]);

  // Prefer authenticated user's role (demo or real). Fallback to env role.
  const role: AppRole = (user?.role as AppRole) || APP_ROLE;

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
        />
      )}
    >
      {/* Keep screens declared for routing, but only show nav items in custom drawer */}
      <Drawer.Screen name="dashboard" options={{ drawerLabel: "Dashboard" }} />
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
    route: "dashboard",
    icon: ({ color, size }) => (
      <MaterialIcons
        name="space-dashboard"
        size={size}
        color={color}
      />
    ),
  },
  {
    key: "visits",
    label: "Visites",
    route: "visits",
    icon: ({ color, size }) => (
      <Ionicons
        name="calendar-outline"
        size={size}
        color={color}
      />
    ),
  },
  {
    key: "patients",
    label: "Patients",
    route: "patients",
    icon: ({ color, size }) => (
      <MaterialIcons
        name="personal-injury"
        size={size}
        color={color}
      />
    ),
  },
  {
    key: "payments",
    label: "Paiements",
    route: "payments",
    roles: ["admin", "assistant"],
    icon: ({ color, size }) => (
      <Ionicons
        name="card-outline"
        size={size}
        color={color}
      />
    ),
  },
  {
    key: "chats",
    label: "Chats",
    route: "chats",
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
    route: "users",
    roles: ["admin"],
    icon: ({ color, size }) => (
      <Fontisto name="persons" size={size} color={color} />
    ),
  },
  {
    key: "settings",
    label: "Paramètres",
    route: "profile",
    icon: ({ color, size }) => (
      <MaterialCommunityIcons
        name="cog-outline"
        size={size}
        color={color}
      />
    ),
  },
];

function CustomDrawerContent({
  expanded,
  setExpanded,
  theme,
  navigation,
  state,
  iconSize,
  role,
}: any) {
  const styles = getStyles(theme);
  const currentRoute = state.routes[state.index].name;
  const items = NAV.filter(
    (i) => !i.roles || i.roles.includes(role),
  );

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
        const active = currentRoute === item.route;
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
                color: active ? theme.colors.primary : theme.colors.textSecondary,
              }}
              icon={({ color }) => item.icon({ active, color, size: iconSize })}
              onPress={() => navigation.navigate(item.route)}
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
