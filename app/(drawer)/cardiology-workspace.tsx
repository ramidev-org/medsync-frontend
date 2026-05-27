import GenericMedicalWorkspacePage from "@/components/workspaces/GenericMedicalWorkspacePage";

export default function CardiologyWorkspacePage() {
  return (
    <GenericMedicalWorkspacePage
      pageTitle="Cardiology Workspace"
      pageSubtitle="Cardiology consultation and monitoring."
      icon="heart-pulse"
      workspaceTitle="Cardiology visit"
      workspaceSubtitle="Vitals, cardiac symptoms, ECG summary, and treatment plan."
      formFields={[
        { key: "blood_pressure", label: "Blood pressure" },
        { key: "heart_rate", label: "Heart rate" },
        { key: "chest_pain", label: "Chest pain" },
        { key: "ecg_summary", label: "ECG summary", multiline: true },
        { key: "plan", label: "Plan", multiline: true },
      ]}
      initialValues={{ blood_pressure: "", heart_rate: "", chest_pain: "", ecg_summary: "", plan: "" }}
      historyRows={[
        "Session #3 - ECG follow-up completed",
        "Session #2 - Cardiac risk factors reviewed",
        "Session #1 - Initial cardiology assessment",
      ]}
    />
  );
}

