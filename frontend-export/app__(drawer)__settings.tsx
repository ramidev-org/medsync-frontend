import { PageShell } from "@/components/layout/page_shell";
import { useAppData } from "@/contexts/appData_context";
import { useAuth } from "@/contexts/auth_context";
import { useTheme } from "@/theme/theme_provider";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";

type SettingsTabKey =
  | "profile"
  | "general"
  | "preferences"
  | "applications"
  | "workspace"
  | "members"
  | "billing"
  | "security";

type SidebarItem = {
  key: SettingsTabKey;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  section: "account" | "workspace";
};

type SettingsStyles = ReturnType<typeof createStyles>;

type ToggleRowProps = {
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  theme: any;
  styles: SettingsStyles;
};

type ChoiceRowProps = {
  title: string;
  description: string;
  value: string;
  theme: any;
  styles: SettingsStyles;
};

type LinkRowProps = {
  title: string;
  description: string;
  actionLabel: string;
  onPress: () => void;
  theme: any;
  styles: SettingsStyles;
};

function ToggleRow({ title, description, value, onValueChange, theme, styles }: ToggleRowProps) {
  return (
    <View style={styles.prefRow}>
      <View style={styles.prefCopy}>
        <Text style={[styles.prefTitle, { color: theme.colors.text }]}>{title}</Text>
        <Text style={[styles.prefDesc, { color: theme.colors.textSecondary }]}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        // Standard pattern is a colored track when on + a neutral thumb -
        // this previously had it backwards (a near-invisible pale-blue
        // track with the THUMB carrying the primary color), which read as
        // "wrong" regardless of on/off state.
        trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
        thumbColor={theme.colors.surface}
        ios_backgroundColor={theme.colors.border}
      />
    </View>
  );
}

function ChoiceRow({ title, description, value, theme, styles }: ChoiceRowProps) {
  return (
    <View style={styles.prefRow}>
      <View style={styles.prefCopy}>
        <Text style={[styles.prefTitle, { color: theme.colors.text }]}>{title}</Text>
        <Text style={[styles.prefDesc, { color: theme.colors.textSecondary }]}>{description}</Text>
      </View>
      <View style={[styles.choicePill, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <Text style={[styles.choiceText, { color: theme.colors.textSecondary }]}>{value}</Text>
        <Ionicons name="chevron-down" size={14} color={theme.colors.textSecondary} />
      </View>
    </View>
  );
}

function LinkRow({ title, description, actionLabel, onPress, theme, styles }: LinkRowProps) {
  return (
    <View style={styles.prefRow}>
      <View style={styles.prefCopy}>
        <Text style={[styles.prefTitle, { color: theme.colors.text }]}>{title}</Text>
        <Text style={[styles.prefDesc, { color: theme.colors.textSecondary }]}>{description}</Text>
      </View>
      <TouchableOpacity onPress={onPress} style={[styles.linkButton, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.linkButtonText, { color: theme.colors.primary }]}>{actionLabel}</Text>
        <Ionicons name="arrow-forward" size={14} color={theme.colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

function SectionCard({ children, theme, styles }: { children: React.ReactNode; theme: any; styles: SettingsStyles }) {
  return <View style={[styles.sectionCard, { borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}>{children}</View>;
}

export default function SettingsPage() {
  const { theme } = useTheme();
  const stylesMemo = React.useMemo(() => createStyles(theme), [theme]);
  const { logout, user } = useAuth();
  const { clinic, isClinicAdmin, subscription } = useAppData();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isCompact = width < 980;

  const [activeTab, setActiveTab] = React.useState<SettingsTabKey>("general");
  const [dailyProductivity, setDailyProductivity] = React.useState(true);
  const [newEventCreated, setNewEventCreated] = React.useState(true);
  const [newTeamAdded, setNewTeamAdded] = React.useState(true);
  const [mobilePush, setMobilePush] = React.useState(true);
  const [desktopNotification, setDesktopNotification] = React.useState(true);
  const [emailNotification, setEmailNotification] = React.useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = React.useState(true);
  const [compactTables, setCompactTables] = React.useState(false);
  const [autoRefresh, setAutoRefresh] = React.useState(true);
  const [appBadges, setAppBadges] = React.useState(true);
  const [sessionAlerts, setSessionAlerts] = React.useState(true);

  const sidebarItems = React.useMemo<SidebarItem[]>(
    () => [
      { key: "profile", label: "My Profile", icon: "person-outline", section: "account" },
      { key: "general", label: "General", icon: "home-outline", section: "account" },
      { key: "preferences", label: "Preferences", icon: "options-outline", section: "account" },
      { key: "applications", label: "Applications", icon: "apps-outline", section: "account" },
      { key: "workspace", label: "Settings", icon: "settings-outline", section: "workspace" },
      { key: "members", label: "Members", icon: "people-outline", section: "workspace" },
      { key: "security", label: "Security", icon: "shield-checkmark-outline", section: "workspace" },
      { key: "billing", label: "Billing & Plan", icon: "card-outline", section: "workspace" },
    ],
    [],
  );

  const tabLabel = React.useMemo(() => sidebarItems.find((item) => item.key === activeTab)?.label ?? "General", [activeTab, sidebarItems]);

  const renderSidebarItem = (item: SidebarItem) => {
    const active = item.key === activeTab;
    return (
      <TouchableOpacity
        key={item.key}
        onPress={() => setActiveTab(item.key)}
        style={[
          stylesMemo.sidebarItem,
          active ? { backgroundColor: theme.colors.surfaceVariant || "#F3F7FF" } : null,
        ]}
      >
        <Ionicons name={item.icon} size={15} color={active ? theme.colors.text : theme.colors.textSecondary} />
        <Text
          style={[
            stylesMemo.sidebarItemText,
            { color: active ? theme.colors.text : theme.colors.textSecondary },
            active ? stylesMemo.sidebarItemTextActive : null,
          ]}
        >
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderGeneralContent = () => (
    <SectionCard theme={theme} styles={stylesMemo}>
      <View style={stylesMemo.sectionBlock}>
        <View style={stylesMemo.sectionHeadingRow}>
          <View>
            <Text style={[stylesMemo.sectionHeading, { color: theme.colors.text }]}>My Notifications</Text>
            <Text style={[stylesMemo.sectionSubheading, { color: theme.colors.textSecondary }]}>Notify me when...</Text>
          </View>
          <TouchableOpacity>
            <Text style={[stylesMemo.helpLink, { color: theme.colors.primary }]}>About notifications?</Text>
          </TouchableOpacity>
        </View>

        <View style={stylesMemo.checkList}>
          <TouchableOpacity style={stylesMemo.checkItem} onPress={() => setDailyProductivity((v) => !v)}>
            <Ionicons name={dailyProductivity ? "checkbox" : "square-outline"} size={17} color={theme.colors.primary} />
            <Text style={[stylesMemo.checkText, { color: theme.colors.textSecondary }]}>Daily productivity update</Text>
          </TouchableOpacity>
          <TouchableOpacity style={stylesMemo.checkItem} onPress={() => setNewEventCreated((v) => !v)}>
            <Ionicons name={newEventCreated ? "checkbox" : "square-outline"} size={17} color={theme.colors.primary} />
            <Text style={[stylesMemo.checkText, { color: theme.colors.textSecondary }]}>New event created</Text>
          </TouchableOpacity>
          <TouchableOpacity style={stylesMemo.checkItem} onPress={() => setNewTeamAdded((v) => !v)}>
            <Ionicons name={newTeamAdded ? "checkbox" : "square-outline"} size={17} color={theme.colors.primary} />
            <Text style={[stylesMemo.checkText, { color: theme.colors.textSecondary }]}>When added on new team</Text>
          </TouchableOpacity>
        </View>

        <ToggleRow title="Mobile push notifications" description="Receive push notification whenever your organisation requires your attention." value={mobilePush} onValueChange={setMobilePush} theme={theme} styles={stylesMemo} />
        <ToggleRow title="Desktop notification" description="Receive desktop notification whenever your organisation requires your attention." value={desktopNotification} onValueChange={setDesktopNotification} theme={theme} styles={stylesMemo} />
        <ToggleRow title="Email notification" description="Receive email whenever your organisation requires your attention." value={emailNotification} onValueChange={setEmailNotification} theme={theme} styles={stylesMemo} />
      </View>

      <View style={[stylesMemo.sectionDivider, { backgroundColor: theme.colors.border }]} />

      <View style={stylesMemo.sectionBlock}>
        <Text style={[stylesMemo.sectionHeading, { color: theme.colors.text }]}>My Settings</Text>
        <ChoiceRow title="Appearance" description="Customize how the theme looks on your device." value="Light" theme={theme} styles={stylesMemo} />
        <ToggleRow title="Two-factor authentication" description="Keep your account secure by enabling 2FA via SMS or using a temporary one-time passcode (TOTP)." value={twoFactorEnabled} onValueChange={setTwoFactorEnabled} theme={theme} styles={stylesMemo} />
        <ChoiceRow title="Language" description="Choose the language used across your workspace." value="English" theme={theme} styles={stylesMemo} />
      </View>
    </SectionCard>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <SectionCard theme={theme} styles={stylesMemo}>
            <View style={stylesMemo.sectionBlock}>
              <Text style={[stylesMemo.sectionHeading, { color: theme.colors.text }]}>My Profile</Text>
              <LinkRow title="Profile details" description={`Manage name, username, avatar color, and professional details for ${user?.fullname || "your account"}.`} actionLabel="Open profile" onPress={() => router.push("/profile")} theme={theme} styles={stylesMemo} />
              <ChoiceRow title="Role" description="Your current role inside the clinic workspace." value={`${String(user?.user_type ?? "assistant")}${isClinicAdmin ? " admin" : ""}`} theme={theme} styles={stylesMemo} />
              <ChoiceRow title="Clinic" description="The clinic currently linked to this account." value={clinic?.name ? String(clinic.name) : "No clinic"} theme={theme} styles={stylesMemo} />
            </View>
          </SectionCard>
        );
      case "preferences":
        return (
          <SectionCard theme={theme} styles={stylesMemo}>
            <View style={stylesMemo.sectionBlock}>
              <Text style={[stylesMemo.sectionHeading, { color: theme.colors.text }]}>Preferences</Text>
              <ToggleRow title="Compact data tables" description="Reduce row height across lists and workspace tables." value={compactTables} onValueChange={setCompactTables} theme={theme} styles={stylesMemo} />
              <ToggleRow title="Auto refresh dashboards" description="Refresh dashboard widgets and counts automatically while you work." value={autoRefresh} onValueChange={setAutoRefresh} theme={theme} styles={stylesMemo} />
              <ChoiceRow title="Default calendar view" description="Choose how schedules should open when visiting the calendar page." value="Week" theme={theme} styles={stylesMemo} />
            </View>
          </SectionCard>
        );
      case "applications":
        return (
          <SectionCard theme={theme} styles={stylesMemo}>
            <View style={stylesMemo.sectionBlock}>
              <Text style={[stylesMemo.sectionHeading, { color: theme.colors.text }]}>Applications</Text>
              <ToggleRow title="Unread badges" description="Show unread counters for key areas such as notifications and chat." value={appBadges} onValueChange={setAppBadges} theme={theme} styles={stylesMemo} />
              <ToggleRow title="Session alerts" description="Warn when another login or sensitive account action is detected." value={sessionAlerts} onValueChange={setSessionAlerts} theme={theme} styles={stylesMemo} />
              <LinkRow title="Notification center" description="Review the full list of alerts and operational updates." actionLabel="Open notifications" onPress={() => router.push("/notifications")} theme={theme} styles={stylesMemo} />
            </View>
          </SectionCard>
        );
      case "workspace":
        return (
          <SectionCard theme={theme} styles={stylesMemo}>
            <View style={stylesMemo.sectionBlock}>
              <Text style={[stylesMemo.sectionHeading, { color: theme.colors.text }]}>Workspace Settings</Text>
              <LinkRow title="Practice settings" description="Update clinic identity, business details, and workspace information." actionLabel="Open practice" onPress={() => router.push("/settings-practice")} theme={theme} styles={stylesMemo} />
              <ChoiceRow title="Current clinic" description="The active workspace connected to your account." value={clinic?.name ? String(clinic.name) : "No clinic"} theme={theme} styles={stylesMemo} />
              <ChoiceRow title="Workspace mode" description="Current workspace access level used inside the clinic." value={isClinicAdmin ? "Clinic admin" : "Standard staff"} theme={theme} styles={stylesMemo} />
            </View>
          </SectionCard>
        );
      case "members":
        return (
          <SectionCard theme={theme} styles={stylesMemo}>
            <View style={stylesMemo.sectionBlock}>
              <Text style={[stylesMemo.sectionHeading, { color: theme.colors.text }]}>Members</Text>
              <LinkRow title="Clinic staff" description="Manage team members, staff access, and invitations." actionLabel="Open staff" onPress={() => router.push(isClinicAdmin ? "/users" : "/profile")} theme={theme} styles={stylesMemo} />
              <ChoiceRow title="Admin access" description="Whether this account can manage clinic-level settings and staff." value={isClinicAdmin ? "Enabled" : "Not enabled"} theme={theme} styles={stylesMemo} />
            </View>
          </SectionCard>
        );
      case "security":
        return (
          <SectionCard theme={theme} styles={stylesMemo}>
            <View style={stylesMemo.sectionBlock}>
              <Text style={[stylesMemo.sectionHeading, { color: theme.colors.text }]}>Security</Text>
              <ToggleRow title="Two-factor authentication" description="Keep your account more secure with an additional verification step." value={twoFactorEnabled} onValueChange={setTwoFactorEnabled} theme={theme} styles={stylesMemo} />
              <LinkRow title="Security settings page" description="Open the full security workspace for password and session-related controls." actionLabel="Open security" onPress={() => router.push("/settings-security")} theme={theme} styles={stylesMemo} />
            </View>
          </SectionCard>
        );
      case "billing":
        return (
          <SectionCard theme={theme} styles={stylesMemo}>
            <View style={stylesMemo.sectionBlock}>
              <Text style={[stylesMemo.sectionHeading, { color: theme.colors.text }]}>Billing & Plan</Text>
              <ChoiceRow title="Current plan" description="Active plan tied to your clinic subscription." value={String(subscription?.tier_plan || clinic?.tier_plan || "basic")} theme={theme} styles={stylesMemo} />
              <ChoiceRow title="Subscription status" description="Current billing and access state." value={String(subscription?.status || "missing").replace(/_/g, " ")} theme={theme} styles={stylesMemo} />
              <LinkRow title="Billing & plan management" description="Review plan limits, renewal details, and billing options." actionLabel="Open subscription" onPress={() => router.push("/settings-subscription")} theme={theme} styles={stylesMemo} />
            </View>
          </SectionCard>
        );
      case "general":
      default:
        return renderGeneralContent();
    }
  };

  return (
    <PageShell scrollable={false} contentStyle={{ flex: 1, paddingTop: 12 }}>
      <View style={[stylesMemo.page, isCompact && stylesMemo.pageCompact]}>
        <View
          style={[
            stylesMemo.sidebar,
            isCompact ? stylesMemo.sidebarCompact : null,
            {
              borderRightWidth: isCompact ? 0 : 1,
              borderBottomWidth: isCompact ? 1 : 0,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text style={[stylesMemo.sidebarCaption, { color: theme.colors.textSecondary }]}>ACCOUNT</Text>
          {sidebarItems.filter((item) => item.section === "account").map(renderSidebarItem)}

          <View style={[stylesMemo.sidebarDivider, { backgroundColor: theme.colors.border }]} />

          <Text style={[stylesMemo.sidebarCaption, { color: theme.colors.textSecondary }]}>WORKSPACE</Text>
          {sidebarItems.filter((item) => item.section === "workspace").map(renderSidebarItem)}

          <View style={[stylesMemo.sidebarDivider, { backgroundColor: theme.colors.border }]} />

          <TouchableOpacity onPress={() => void logout()} style={stylesMemo.logoutItem}>
            <Ionicons name="log-out-outline" size={15} color={theme.colors.error} />
            <Text style={[stylesMemo.sidebarItemText, { color: theme.colors.error }]}>Logout</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={stylesMemo.contentScroll} contentContainerStyle={stylesMemo.contentInner} showsVerticalScrollIndicator={false}>
          <View style={[stylesMemo.breadcrumbRow, { borderBottomColor: theme.colors.border }]}>
            <Text style={[stylesMemo.breadcrumbTitle, { color: theme.colors.text }]}>Settings</Text>
            <Ionicons name="chevron-forward" size={14} color={theme.colors.textSecondary} />
            <Text style={[stylesMemo.breadcrumbCurrent, { color: theme.colors.textSecondary }]}>{tabLabel}</Text>
          </View>

          {renderTabContent()}
        </ScrollView>
      </View>
    </PageShell>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    page: {
      flex: 1,
      flexDirection: "row",
      gap: 18,
    },
    pageCompact: {
      flexDirection: "column",
      gap: 12,
    },
    sidebar: {
      width: 185,
      paddingTop: 10,
      paddingRight: 14,
    },
    sidebarCompact: {
      width: "100%",
      paddingRight: 0,
      paddingBottom: 10,
    },
    sidebarCaption: {
      fontSize: 10,
      fontWeight: "600",
      marginBottom: 8,
      letterSpacing: 0.5,
    },
    sidebarDivider: {
      height: 1,
      marginVertical: 12,
    },
    sidebarItem: {
      height: 36,
      borderRadius: 10,
      paddingHorizontal: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 4,
    },
    sidebarItemText: {
      fontSize: 12,
      fontWeight: "700",
    },
    sidebarItemTextActive: {
      fontWeight: "600",
    },
    logoutItem: {
      height: 36,
      borderRadius: 10,
      paddingHorizontal: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    contentScroll: {
      flex: 1,
    },
    contentInner: {
      paddingBottom: 24,
    },
    breadcrumbRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingBottom: 18,
      marginBottom: 22,
      borderBottomWidth: 1,
    },
    breadcrumbTitle: {
      fontSize: 28,
      fontWeight: "600",
    },
    breadcrumbCurrent: {
      fontSize: 13,
      fontWeight: "700",
    },
    sectionCard: {
      borderWidth: 1,
      borderRadius: 20,
      padding: 20,
    },
    sectionBlock: {
      gap: 14,
    },
    sectionHeadingRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 12,
      flexWrap: "wrap",
    },
    sectionHeading: {
      fontSize: 26,
      fontWeight: "600",
    },
    sectionSubheading: {
      marginTop: 6,
      fontSize: 14,
      fontWeight: "600",
    },
    helpLink: {
      fontSize: 13,
      fontWeight: "700",
      marginTop: 4,
    },
    checkList: {
      gap: 10,
      paddingBottom: 10,
    },
    checkItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    checkText: {
      fontSize: 13,
      fontWeight: "600",
    },
    prefRow: {
      minHeight: 72,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 16,
      paddingVertical: 10,
    },
    prefCopy: {
      flex: 1,
    },
    prefTitle: {
      fontSize: 18,
      fontWeight: "700",
    },
    prefDesc: {
      marginTop: 5,
      fontSize: 13,
      fontWeight: "500",
      lineHeight: 19,
      maxWidth: 760,
    },
    choicePill: {
      minWidth: 102,
      height: 36,
      borderRadius: 10,
      borderWidth: 1,
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    choiceText: {
      fontSize: 13,
      fontWeight: "700",
    },
    linkButton: {
      minWidth: 120,
      height: 38,
      borderRadius: 10,
      borderWidth: 1,
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    linkButtonText: {
      fontSize: 13,
      fontWeight: "600",
    },
    sectionDivider: {
      height: 1,
      marginVertical: 24,
    },
  });
