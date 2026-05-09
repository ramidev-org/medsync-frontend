import { PageShell } from "@/components/page_shell";
import { useTheme } from "@/theme/theme_provider";
import { useState } from "react";
import { ScrollView } from "react-native";

import { DentistryTab, type DentistryState } from "../consultation/_tabs/observation_specialities/_dentistry";

export default function ObservationDentistryScreen() {
  const { theme } = useTheme();
  const [value, setValue] = useState<DentistryState>({});

  return (
    <PageShell title="Observation • Dentistry" subtitle="Prototype speciality observation UI (standalone).">
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <DentistryTab theme={theme} value={value} onChange={setValue} />
      </ScrollView>
    </PageShell>
  );
}

