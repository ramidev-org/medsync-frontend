import GenericMedicalWorkspacePage from "@/components/workspaces/GenericMedicalWorkspacePage";

export default function EndocrinologyWorkspacePage() {
  return (
    <GenericMedicalWorkspacePage
      pageTitle="Endocrinology / Diabetes Workspace"
      pageSubtitle="Structured diabetes and endocrine follow-up workflow."
      icon="chart-line"
      workspaceTitle="Endocrinology consultation"
      workspaceSubtitle="Glucose profile, HbA1c, complications and endocrine plan."
      formFields={[
        { key: "diabetes_type", label: "Diabetes type" },
        { key: "fasting_glucose", label: "Fasting glucose" },
        { key: "hba1c", label: "HbA1c" },
        { key: "endocrine_plan", label: "Endocrine plan", multiline: true },
      ]}
      initialValues={{ diabetes_type: "", fasting_glucose: "", hba1c: "", endocrine_plan: "" }}
      historyRows={["Session #3 - Regimen adjusted", "Session #2 - Foot exam added", "Session #1 - Baseline labs"]}
    />
  );
}

