import { PageShell } from "@/components/page_shell";
import { useTheme } from "@/theme/theme_provider";
import React from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Alert, View } from "react-native";
import ObservationMedicalTab from "./consultation/_tabs/_observation";

const initialVitals = {
  taille_cm: "",
  poids_kg: "",
  tension: "",
  temperature_c: "",
};

const initialParams = {
  motif_consultation: "",
  glycemie: "",
  hba1c: "",
  examen_clinique: "",
  conclusion: "",
};

export default function OrthopedicsWorkspacePage() {
  const { theme } = useTheme();
  const [vitals, setVitals] = React.useState(initialVitals);
  const [parameters, setParameters] = React.useState(initialParams);
  const [observations, setObservations] = React.useState("");

  return (
    <PageShell
      title="Orthopedics Workspace"
      subtitle="Observation capture (generic)."
      actions={<MaterialCommunityIcons name="bone" size={24} color={theme.colors.primary} />}
    >
      <View style={{ marginTop: 10 }}>
        <ObservationMedicalTab
          theme={theme}
          doctorSpeciality="orthopedics"
          vitals={vitals}
          setVitals={setVitals}
          parameters={parameters}
          setParameters={setParameters}
          observations={observations}
          setObservations={setObservations}
          onSave={() =>
            Alert.alert("Saved", "Workspace note saved locally (no appointment linked yet).")
          }
          workspaceMode
        />
      </View>
    </PageShell>
  );
}

