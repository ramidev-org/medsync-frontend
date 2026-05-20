export const theme = {
  colors: {
    primary: "#2563EB",
    secondary: "#4F46E5",
    accent: "#E0ECFF",
    success: "#2E9B63",
    warning: "#E6A23C",
    error: "#E0565B",
    info: "#4AA3D9",
    background: "#F4F7FB",
    surface: "#FFFFFF",
    surfaceVariant: "#EDF2FA",
    card: "#FFFFFF",
    text: "#0F172A",
    textSecondary: "#64748B",
    border: "#D8E1EE",
    muted: "#8695AA",
    disabled: "#C4CEDD",
    overlay: "rgba(15, 23, 42, 0.35)",
    textOnPrimary: "#FFFFFF",
    hoverBg: "rgba(37, 99, 235, 0.08)",
    pressedBg: "rgba(37, 99, 235, 0.16)",
    primarySoft: "#E0ECFF",
    chipBg: "#EDF2FA",
    chipText: "#2563EB",
  },
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "32px",
  },
  radius: {
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "20px",
    full: "9999px",
  },
} as const;

export const dashboardNav = [
  {
    section: "Main",
    items: [
      { label: "Dashboard", href: "/dashboard", short: "DB" },
      { label: "Calendar", href: "/calendar", short: "CA" },
      { label: "Patients", href: "/patients", short: "PA" },
      { label: "Visits", href: "/visits", short: "VI" },
      { label: "Consultations", href: "/consultations", short: "CO" },
    ],
  },
  {
    section: "Medical Workspaces",
    items: [
      { label: "Dentistry", href: "/workspaces/dentistry", short: "DE" },
      { label: "Dermatology", href: "/workspaces/dermatology", short: "DR" },
      { label: "Orthopedics", href: "/workspaces/orthopedics", short: "OR" },
      { label: "Gynecology", href: "/workspaces/gynecology", short: "GY" },
      { label: "Cardiology", href: "/workspaces/cardiology", short: "CR" },
    ],
  },
  {
    section: "Management",
    items: [
      { label: "Billing", href: "/billing", short: "BI" },
      { label: "Services", href: "/services", short: "SE" },
      { label: "Reports", href: "/reports", short: "RE" },
      { label: "Tasks", href: "/tasks", short: "TA" },
      { label: "Inventory", href: "/inventory", short: "IN" },
      { label: "Team", href: "/team", short: "TE" },
    ],
  },
];

export const dashboardMetrics = [
  { label: "Appointments today", value: "18", helper: "4 pending confirmation" },
  { label: "Patients this week", value: "126", helper: "Up 9% vs last week" },
  { label: "Revenue tracked", value: "1.24M DZD", helper: "Collected across 42 invoices" },
  { label: "Prescription print jobs", value: "34", helper: "Ready for PDF and browser print" },
];
