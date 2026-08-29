export const colors = {
  primary: "#2563EB",
  secondary: "#4F46E5",
  accent: "#E0ECFF",
  success: "#2E9B63",
  warning: "#E6A23C",
  error: "#E0565B",
  info: "#4AA3D9",

  soft: {
    primary: "#EFF6FF",
    success: "#ECFDF5",
    warning: "#FFF7ED",
    error: "#FEF2F2",
    neutral: "#F1F5F9",
  },

  light: {
    background: "#F4F7FB",
    surface: "#FFFFFF",
    surfaceVariant: "#EDF2FA",
    // Near-white tints that sit *between* surface (#FFFFFF) and
    // surfaceVariant (#EDF2FA). Used for large calm areas - side panels,
    // card headers, dashed placeholder cards - where surfaceVariant reads
    // as too grey/heavy against white.
    surfaceSubtle: "#FBFCFE",
    surfaceRaised: "#F8FAFD",
    card: "#FFFFFF",
    text: "#0F172A",
    textSecondary: "#64748B",
    border: "#D8E1EE",
    // Hairline divider for dense list rows, where the standard border
    // (#D8E1EE) stacks up into visually heavy banding.
    borderSubtle: "#EFF3F8",
    // Structural divider between chrome sections (a page header's own
    // meter/tabs area, a panel head, a field card) - between `border`
    // (solid card/component outlines) and `borderSubtle` (repeated rows).
    borderMuted: "#E4EAF3",
    // Soft blue border/fill for "empty but available" affordances
    // (dashed seat cards) and locked/inherited toggles.
    borderAccent: "#B9CCE9",
    // Unfilled segment of a seat/quota meter - distinct from `border`,
    // slightly bluer so a mostly-empty meter doesn't read as just grey.
    meterTrackEmpty: "#DCE4EF",
    muted: "#8695AA",
    disabled: "#C4CEDD",
    overlay: "rgba(15, 23, 42, 0.35)",
  },

  // Medical status colors
  status: {
    active: "#2E9B63",
    inactive: "#97A3B6",
    urgent: "#E0565B",
    scheduled: "#4AA3D9",
    completed: "#2F6FED",
    cancelled: "#97A3B6",
  },

  // Chart colors for data visualization
  charts: {
    blue: "#0077B6",
    cyan: "#00B4D8",
    teal: "#06D6A0",
    amber: "#FFB703",
    pink: "#EF476F",
    purple: "#7209B7",
    indigo: "#3A0CA3",
    lightBlue: "#90E0EF",
  },
};
