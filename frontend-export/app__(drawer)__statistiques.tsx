import { Redirect } from "expo-router";

// Merged into /reports (see reports.tsx "Detailed Charts" section) - this
// route only exists so an old link/bookmark doesn't 404.
export default function StatistiquesRedirect() {
  return <Redirect href="/reports" />;
}
