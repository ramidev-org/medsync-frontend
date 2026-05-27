import GenericMedicalWorkspacePage from "@/components/workspaces/GenericMedicalWorkspacePage";

export default function GastroenterologyWorkspacePage() {
  return (
    <GenericMedicalWorkspacePage
      pageTitle="Gastroenterology Workspace"
      pageSubtitle="Digestive consultation workflow with structured notes."
      icon="stomach"
      workspaceTitle="Gastroenterology consultation"
      workspaceSubtitle="Abdominal symptoms, bowel pattern, exam and imaging summary."
      formFields={[
        { key: "abdominal_pain_site", label: "Abdominal pain site" },
        { key: "bowel_habits", label: "Bowel habits", multiline: true },
        { key: "abdominal_exam", label: "Abdominal exam", multiline: true },
        { key: "endoscopy_summary", label: "Endoscopy summary", multiline: true },
      ]}
      initialValues={{ abdominal_pain_site: "", bowel_habits: "", abdominal_exam: "", endoscopy_summary: "" }}
      historyRows={["Session #3 - Diet adjusted", "Session #2 - Endoscopy reviewed", "Session #1 - Initial GI assessment"]}
    />
  );
}

