import { Redirect } from "expo-router";

// Home is merged into Dashboard.
export default function Index() {
  return <Redirect href="/dashboard" />;
}
