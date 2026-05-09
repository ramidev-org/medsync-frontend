import { PageShell } from "@/components/page_shell";
import { useTheme } from "@/theme/theme_provider";
import { useState } from "react";
import { ScrollView } from "react-native";

import { CardiologyTab, type CardiologyState } from "../consultation/_tabs/observation_specialities/_cardiologie";

export default function ObservationCardiologyScreen() {
  const { theme } = useTheme();
  const [value, setValue] = useState<CardiologyState>({});

  return (
    <PageShell title="Observation • Cardiology" subtitle="Prototype speciality observation UI (standalone).">
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <CardiologyTab theme={theme} value={value} onChange={setValue} />
      </ScrollView>
    </PageShell>
  );
}

