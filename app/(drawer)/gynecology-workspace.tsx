import GenericMedicalWorkspacePage from "@/components/workspaces/GenericMedicalWorkspacePage";

export default function GynecologyWorkspacePage() {
  return (
    <GenericMedicalWorkspacePage
      pageTitle="Gynecology Workspace"
      pageSubtitle="Gynecology and obstetrics consultation workflow."
      icon="human-female"
      workspaceTitle="Gynecology / Obstetrics"
      workspaceSubtitle="Cycle and pregnancy follow-up, warning symptoms, and plan."
      formFields={[
        { key: "lmp", label: "LMP" },
        { key: "pregnancy_status", label: "Pregnancy status" },
        { key: "gestational_age_weeks", label: "Gestational age (weeks)" },
        { key: "warning_symptoms", label: "Warning symptoms", multiline: true },
        { key: "plan", label: "Plan", multiline: true },
      ]}
      initialValues={{ lmp: "", pregnancy_status: "", gestational_age_weeks: "", warning_symptoms: "", plan: "" }}
      historyRows={[
        "Session #3 - Prenatal lab summary updated",
        "Session #2 - Ultrasound review",
        "Session #1 - Initial gynecology/obstetrics assessment",
      ]}
    />
  );
}

