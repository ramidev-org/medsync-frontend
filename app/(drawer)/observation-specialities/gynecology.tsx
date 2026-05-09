import { PageShell } from "@/components/page_shell";
import { useTheme } from "@/theme/theme_provider";
import { useState } from "react";
import { ScrollView } from "react-native";

import { GynecologyTab, type GynecologyState } from "../consultation/_tabs/observation_specialities/_gynecologie";

export default function ObservationGynecologyScreen() {
  const { theme } = useTheme();
  const [value, setValue] = useState<GynecologyState>({});

  return (
    <PageShell title="Observation • Gynecology" subtitle="Prototype speciality observation UI (standalone).">
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <GynecologyTab theme={theme} onModifyLabel={() => {}} value={value} onChange={setValue} />
      </ScrollView>
    </PageShell>
  );
}
