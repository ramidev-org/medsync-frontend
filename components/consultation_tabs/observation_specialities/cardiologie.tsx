import { BlueField } from "@/components/consultation_tabs/ui";
import { StyleSheet, Text, View } from "react-native";

export type CardiologyState = {
  douleur?: string;
  dyspnee?: string;
  palpitations?: string;
  examen?: string;
  conclusion?: string;
};

export function CardiologyTab({
  theme,
  value,
  onChange,
}: {
  theme: any;
  value: CardiologyState;
  onChange: (next: CardiologyState) => void;
}) {
  const styles = createStyles(theme);
  const set = (p: Partial<CardiologyState>) => onChange({ ...value, ...p });

  return (
    <View style={{ gap: 12 }}>
      <Text style={styles.title}>CARDIOLOGIE</Text>

      <View style={styles.row}>
        <BlueField theme={theme} label="Douleur thoracique" value={value.douleur ?? ""} onChange={(v: string) => set({ douleur: v })} minHeight={56} />
        <BlueField theme={theme} label="Dyspnée" value={value.dyspnee ?? ""} onChange={(v: string) => set({ dyspnee: v })} minHeight={56} />
      </View>

      <BlueField theme={theme} label="Palpitations" value={value.palpitations ?? ""} onChange={(v: string) => set({ palpitations: v })} minHeight={56} />
      <BlueField theme={theme} label="Examen clinique" value={value.examen ?? ""} onChange={(v: string) => set({ examen: v })} multiline minHeight={90} />
      <BlueField theme={theme} label="Conclusion" value={value.conclusion ?? ""} onChange={(v: string) => set({ conclusion: v })} multiline minHeight={90} />
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    title: { fontWeight: "900", color: theme.colors.primary },
    row: { flexDirection: "row", gap: 12 },
  });
