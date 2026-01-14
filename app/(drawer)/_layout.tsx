import { useTheme } from "@/theme/theme_provider";
import { Fontisto, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { DrawerContentScrollView, DrawerItem } from "@react-navigation/drawer";
import { Drawer } from "expo-router/drawer";
import { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

export default function Layout() {



  const { theme } = useTheme();
  const styles = getStyles(theme);

  const [expanded, setExpanded] = useState(false);
  const drawerWidth = expanded ? 200 : 100;

  // Configurable icon and label sizes
  const iconSize = 26;
  const labelSize = 16;

  return (
    <Drawer
      screenOptions={{
        headerShown: false,
        drawerType: "permanent",
        swipeEnabled: false,
        drawerStyle: {
          backgroundColor: theme.colors.surface,
          width: drawerWidth,
        },
        drawerActiveTintColor: theme.colors.primary,
        drawerInactiveTintColor: "#94a3b8",
        drawerLabelStyle: {
          ...styles.label,
          display: expanded ? "flex" : "none",
          fontSize: labelSize,
        },
      }}
      drawerContent={(props) => (
        <CustomDrawerContent
          {...props}
          expanded={expanded}
          setExpanded={setExpanded}
          theme={theme}
          iconSize={iconSize}
          labelSize={labelSize}
        />
      )}
    >
      <Drawer.Screen name="index" options={{ drawerLabel: "Home" }} />
      <Drawer.Screen name="dashboard" options={{ drawerLabel: "Dashboard" }} />
      <Drawer.Screen name="visits" options={{ drawerLabel: "Visits" }} />
      <Drawer.Screen name="patients" options={{ drawerLabel: "Patients" }} />
      <Drawer.Screen name="payments" options={{ drawerLabel: "Payments" }} />
      <Drawer.Screen name="chats" options={{ drawerLabel: "Chats" }} />
      <Drawer.Screen name="users" options={{ drawerLabel: "Users" }} />
      <Drawer.Screen name="settings" options={{ drawerLabel: "Settings" }} />
    </Drawer>
  );
}

function CustomDrawerContent({
  expanded,
  setExpanded,
  theme,
  navigation,
  state,
  iconSize,
  labelSize,
}: any) {
  const currentRoute = state.routes[state.index].name;

  return (
    <DrawerContentScrollView contentContainerStyle={{ flex: 1 }}>
      {/* Burger icon at the top */}
      <View style={{ padding: 16 }}>
        <TouchableOpacity onPress={() => setExpanded(!expanded)}>
          <Ionicons name="menu" size={iconSize} color={"#94a3b8"} />
        </TouchableOpacity>
      </View>

      {/* Drawer items */}
      <DrawerItem
        label="Home"
        labelStyle={{ fontSize: labelSize }}
        icon={({ color }) => (
          <Ionicons
            name="home-outline"
            size={iconSize}
            color={currentRoute === "index" ? theme.colors.primary : color}
          />
        )}
        onPress={() => navigation.navigate("index")}
      />

      <DrawerItem
        label="Dashboard"
        labelStyle={{ fontSize: labelSize }}
        icon={({ color }) => (
          <MaterialIcons
            name="space-dashboard"
            size={iconSize}
            color={currentRoute === "dashboard" ? theme.colors.primary : color}
          />
        )}
        onPress={() => navigation.navigate("dashboard")}
      />
      <DrawerItem
        label="Visits"
        labelStyle={{ fontSize: labelSize }}
        icon={({ color }) => (
          <Ionicons
            name="calendar-outline"
            size={iconSize}
            color={currentRoute === "visits" ? theme.colors.primary : color}
          />
        )}
        onPress={() => navigation.navigate("visits")}
      />
      <DrawerItem
        label="Patients"
        labelStyle={{ fontSize: labelSize }}
        icon={({ color }) => (
          <MaterialIcons
            name="personal-injury"
            size={iconSize}
            color={currentRoute === "patients" ? theme.colors.primary : color}
          />
        )}
        onPress={() => navigation.navigate("patients")}
      />
      <DrawerItem
        label="Payments"
        labelStyle={{ fontSize: labelSize }}
        icon={({ color }) => (
          <Ionicons
            name="card-outline"
            size={iconSize}
            color={currentRoute === "payments" ? theme.colors.primary : color}
          />
        )}
        onPress={() => navigation.navigate("payments")}
      />
      <DrawerItem
        label="Chats"
        labelStyle={{ fontSize: labelSize }}
        icon={({ color }) => (
          <Ionicons
            name="chatbox-ellipses-outline"
            size={iconSize}
            color={currentRoute === "chats" ? theme.colors.primary : color}
          />
        )}
        onPress={() => navigation.navigate("chats")}
      />
      <DrawerItem
        label="Users"
        labelStyle={{ fontSize: labelSize }}
        icon={({ color }) => (
          <Fontisto
            name="persons"
            size={iconSize}
            color={currentRoute === "users" ? theme.colors.primary : color}
          />
        )}
        onPress={() => navigation.navigate("users")}
      />
      <DrawerItem
        label="Settings"
        labelStyle={{ fontSize: labelSize }}
        icon={({ color }) => (
          <Ionicons
            name="settings-outline"
            size={iconSize}
            color={currentRoute === "settings" ? theme.colors.primary : color}
          />
        )}
        onPress={() => navigation.navigate("settings")}
      />
    </DrawerContentScrollView>
  );
}

const getStyles = (theme: any) =>
  StyleSheet.create({
    label: {
      marginLeft: -8,
    },
  });
