import GenericMedicalWorkspacePage from "@/components/workspaces/GenericMedicalWorkspacePage";

export default function EntWorkspacePage() {
  return (
    <GenericMedicalWorkspacePage
      pageTitle="ENT Workspace"
      pageSubtitle="ENT consultation workflow with structured exam notes."
      icon="ear-hearing"
      workspaceTitle="ENT consultation"
      workspaceSubtitle="Ear, nose, throat symptoms and exam timeline."
      formFields={[
        { key: "ear_symptoms", label: "Ear symptoms", multiline: true },
        { key: "nose_symptoms", label: "Nose symptoms", multiline: true },
        { key: "throat_symptoms", label: "Throat symptoms", multiline: true },
        { key: "ent_plan", label: "Plan", multiline: true },
      ]}
      initialValues={{ ear_symptoms: "", nose_symptoms: "", throat_symptoms: "", ent_plan: "" }}
      historyRows={["Session #3 - Hearing improved", "Session #2 - Otoscopy review", "Session #1 - Initial ENT assessment"]}
    />
  );
}

