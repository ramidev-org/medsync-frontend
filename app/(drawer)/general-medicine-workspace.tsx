import GenericMedicalWorkspacePage from "@/components/workspaces/GenericMedicalWorkspacePage";

export default function GeneralMedicineWorkspacePage() {
  return (
    <GenericMedicalWorkspacePage
      pageTitle="General Medicine Workspace"
      pageSubtitle="General medicine follow-up and structured exam workflow."
      icon="stethoscope"
      workspaceTitle="General medicine consultation"
      workspaceSubtitle="Visit data, symptoms, exam summary, diagnosis and follow-up plan."
      formFields={[
        { key: "reason_for_visit", label: "Reason for visit", multiline: true },
        { key: "chief_complaint", label: "Chief complaint", multiline: true },
        { key: "systems_review", label: "Systems review", multiline: true },
        { key: "general_exam", label: "General exam", multiline: true },
        { key: "plan", label: "Plan", multiline: true },
      ]}
      initialValues={{ reason_for_visit: "", chief_complaint: "", systems_review: "", general_exam: "", plan: "" }}
      historyRows={[
        "Session #3 - Follow-up plan updated",
        "Session #2 - Diagnosis confirmed",
        "Session #1 - Initial assessment",
      ]}
    />
  );
}

