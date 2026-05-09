import { PageShell } from "@/components/page_shell";
import { useTheme } from "@/theme/theme_provider";
import { useState } from "react";
import { ScrollView } from "react-native";

import { DermatologyTab, type DermatologyState } from "../consultation/_tabs/observation_specialities/_dermatologie";

export default function ObservationDermatologyScreen() {
  const { theme } = useTheme();
  const [value, setValue] = useState<DermatologyState>({});

  return (
    <PageShell title="Observation • Dermatology" subtitle="Prototype speciality observation UI (standalone).">
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <DermatologyTab theme={theme} value={value} onChange={setValue} />
      </ScrollView>
    </PageShell>
  );
}

