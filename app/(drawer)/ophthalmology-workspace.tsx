import GenericMedicalWorkspacePage from "@/components/workspaces/GenericMedicalWorkspacePage";

export default function OphthalmologyWorkspacePage() {
  return (
    <GenericMedicalWorkspacePage
      pageTitle="Ophthalmology Workspace"
      pageSubtitle="Eye exam and follow-up workflow."
      icon="eye-outline"
      workspaceTitle="Ophthalmology consultation"
      workspaceSubtitle="Visual acuity, pressure, segment findings and imaging notes."
      formFields={[
        { key: "visual_acuity_right", label: "Visual acuity right" },
        { key: "visual_acuity_left", label: "Visual acuity left" },
        { key: "intraocular_pressure", label: "Intraocular pressure" },
        { key: "fundus_exam", label: "Fundus exam", multiline: true },
      ]}
      initialValues={{ visual_acuity_right: "", visual_acuity_left: "", intraocular_pressure: "", fundus_exam: "" }}
      historyRows={["Session #3 - Refraction adjusted", "Session #2 - IOP follow-up", "Session #1 - Initial eye exam"]}
    />
  );
}

