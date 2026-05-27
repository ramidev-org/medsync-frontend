import GenericMedicalWorkspacePage from "@/components/workspaces/GenericMedicalWorkspacePage";

export default function PulmonologyWorkspacePage() {
  return (
    <GenericMedicalWorkspacePage
      pageTitle="Pulmonology Workspace"
      pageSubtitle="Respiratory consultation and follow-up workflow."
      icon="lungs"
      workspaceTitle="Pulmonology consultation"
      workspaceSubtitle="Respiratory symptoms, auscultation, spirometry and oxygen status."
      formFields={[
        { key: "cough", label: "Cough" },
        { key: "dyspnea_grade", label: "Dyspnea grade" },
        { key: "lung_auscultation", label: "Lung auscultation", multiline: true },
        { key: "spirometry_summary", label: "Spirometry summary", multiline: true },
      ]}
      initialValues={{ cough: "", dyspnea_grade: "", lung_auscultation: "", spirometry_summary: "" }}
      historyRows={["Session #3 - Oxygen improved", "Session #2 - Spirometry repeat", "Session #1 - Initial pulmonology assessment"]}
    />
  );
}

