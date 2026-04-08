import { ThemedCard } from "@/components/default_card";
import { Text } from "react-native";

export default function PlaceholderTab({ theme, title }: { theme: any; title: string }) {
  return (
    <ThemedCard>
      <Text style={{ fontSize: 16, fontWeight: "900" }}>{title}</Text>
      <Text style={{ opacity: 0.6, marginTop: 8 }}>Module à implémenter</Text>
    </ThemedCard>
  );
}
