import { Platform } from "react-native";

// Single source of truth for page "side gutter" across the app.
// Change this value and every page that uses the shared container updates.
export const PAGE_GUTTER = 80;

// Common web constraint: fill the available width (no fixed maxWidth centering).
export function getWebContainerFill() {
  return Platform.OS === "web"
    ? ({
        width: "100%",
        alignSelf: "stretch",
      } as any)
    : {};
}
