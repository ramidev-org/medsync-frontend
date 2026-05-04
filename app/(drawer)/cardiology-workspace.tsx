import { PageShell } from "@/components/page_shell";
import { useTheme } from "@/theme/theme_provider";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";
import { TextArea, TextField, Dropdown, NumberField } from "@/components/input_fields";

export default function CardiologyWorkspacePage() {
  const { theme } = useTheme();
  const [state, setState] = React.useState({
    complaint: "",
    risk: "Low",
    chestPain: "No",
    bp: "",
    hr: "",
    assessment: "",
    plan: "",
  });

  return (
    <PageShell title="Cardiology Workspace" subtitle="Fast structured capture for cardiology visits.">
      <View style={{ paddingBottom: 8 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: 999,
            alignSelf: "flex-start",
            paddingHorizontal: 10,
            paddingVertical: 6,
            backgroundColor: theme.colors.surface,
          }}
        >
          <MaterialCommunityIcons name="medical-bag" size={14} color={theme.colors.primary} />
          <Text style={{ fontWeight: "900", color: theme.colors.primary, fontSize: 12, letterSpacing: 0.3, textTransform: "uppercase" }}>
            Cardiology Workspace
          </Text>
        </View>
      </View>

      <Text style={{ fontWeight: "900", color: theme.colors.primary, marginTop: 2 }}>Cardiology Note</Text>
      <View style={{ marginTop: 12, gap: 2 }}>
        <TextField label="Chief complaint" value={state.complaint} onChangeText={(complaint) => setState((s) => ({ ...s, complaint }))} prefixIcon={"chatbubble-ellipses-outline" as any} placeholder="e.g. chest pain, palpitations..." />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          <View style={{ minWidth: 220, flexGrow: 1, flexBasis: 220 }}>
            <Dropdown label="Chest pain" value={state.chestPain} options={["No", "Yes"]} onChange={(chestPain) => setState((s) => ({ ...s, chestPain }))} prefixIcon={"heart-outline" as any} />
          </View>
          <View style={{ minWidth: 220, flexGrow: 1, flexBasis: 220 }}>
            <Dropdown label="Risk" value={state.risk} options={["Low", "Moderate", "High"]} onChange={(risk) => setState((s) => ({ ...s, risk }))} prefixIcon={"alert-circle-outline" as any} />
          </View>
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          <View style={{ minWidth: 220, flexGrow: 1, flexBasis: 220 }}>
            <TextField label="Blood pressure" value={state.bp} onChangeText={(bp) => setState((s) => ({ ...s, bp }))} prefixIcon={"speedometer-outline" as any} placeholder="e.g. 120/80" />
          </View>
          <View style={{ minWidth: 220, flexGrow: 1, flexBasis: 220 }}>
            <NumberField label="Heart rate" value={state.hr} onChangeText={(hr) => setState((s) => ({ ...s, hr }))} prefixIcon={"pulse-outline" as any} placeholder="bpm" />
          </View>
        </View>
        <TextArea label="Assessment" value={state.assessment} onChangeText={(assessment) => setState((s) => ({ ...s, assessment }))} prefixIcon={"document-text-outline" as any} rows={4} placeholder="Working diagnosis, ECG/troponin, differentials..." />
        <TextArea label="Plan" value={state.plan} onChangeText={(plan) => setState((s) => ({ ...s, plan }))} prefixIcon={"checkmark-done-outline" as any} rows={4} placeholder="Meds, tests, referrals, follow-up..." />
      </View>
    </PageShell>
  );
}
