import { BlueField } from "../_ui";
import { StyleSheet, Text, View } from "react-native";

export type DermatologyState = {
  plainte?: string;
  topographie?: string;
  aspect?: string;
  examen?: string;
  conclusion?: string;
};

export function DermatologyTab({
  theme,
  value,
  onChange,
}: {
  theme: any;
  value: DermatologyState;
  onChange: (next: DermatologyState) => void;
}) {
  const styles = createStyles(theme);
  const set = (p: Partial<DermatologyState>) => onChange({ ...value, ...p });

  return (
    <View style={{ gap: 12 }}>
      <Text style={styles.title}>DERMATOLOGIE</Text>

      <BlueField theme={theme} label="Plainte / Motif" value={value.plainte ?? ""} onChange={(v: string) => set({ plainte: v })} multiline minHeight={80} />

      <View style={styles.row}>
        <BlueField theme={theme} label="Topographie" value={value.topographie ?? ""} onChange={(v: string) => set({ topographie: v })} minHeight={56} />
        <BlueField theme={theme} label="Aspect" value={value.aspect ?? ""} onChange={(v: string) => set({ aspect: v })} minHeight={56} />
      </View>

      <BlueField theme={theme} label="Examen" value={value.examen ?? ""} onChange={(v: string) => set({ examen: v })} multiline minHeight={100} />
      <BlueField theme={theme} label="Conclusion" value={value.conclusion ?? ""} onChange={(v: string) => set({ conclusion: v })} multiline minHeight={90} />
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    title: { fontWeight: "900", color: theme.colors.primary },
    row: { flexDirection: "row", gap: 12 },
  });

// Not a route screen; keep router scanning happy.
export default function DermatologyRoute() {
  return null;
}
