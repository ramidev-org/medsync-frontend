import GenericMedicalWorkspacePage from "@/components/workspaces/GenericMedicalWorkspacePage";

export default function PediatricsWorkspacePage() {
  return (
    <GenericMedicalWorkspacePage
      pageTitle="Pediatrics Workspace"
      pageSubtitle="Pediatric growth, development, and follow-up workflow."
      icon="baby-face-outline"
      workspaceTitle="Pediatrics consultation"
      workspaceSubtitle="Birth history, growth notes, development and follow-up sessions."
      formFields={[
        { key: "birth_history", label: "Birth history", multiline: true },
        { key: "feeding", label: "Feeding" },
        { key: "development_notes", label: "Development notes", multiline: true },
        { key: "vaccination_status", label: "Vaccination status", multiline: true },
      ]}
      initialValues={{ birth_history: "", feeding: "", development_notes: "", vaccination_status: "" }}
      historyRows={["Session #3 - Growth check", "Session #2 - Vaccination review", "Session #1 - Initial pediatric assessment"]}
    />
  );
}

