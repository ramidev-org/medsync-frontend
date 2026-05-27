import GenericMedicalWorkspacePage from "@/components/workspaces/GenericMedicalWorkspacePage";

export default function OrthopedicsWorkspacePage() {
  return (
    <GenericMedicalWorkspacePage
      pageTitle="Orthopedics Workspace"
      pageSubtitle="Orthopedics injury and recovery workflow."
      icon="bone"
      workspaceTitle="Orthopedics exam"
      workspaceSubtitle="Injury mechanism, range of motion, strength, imaging, and rehab plan."
      formFields={[
        { key: "injury_mechanism", label: "Injury mechanism", multiline: true },
        { key: "affected_region", label: "Affected region" },
        { key: "range_of_motion", label: "Range of motion", multiline: true },
        { key: "imaging_summary", label: "Imaging summary", multiline: true },
        { key: "rehab_plan", label: "Rehab plan", multiline: true },
      ]}
      initialValues={{ injury_mechanism: "", affected_region: "", range_of_motion: "", imaging_summary: "", rehab_plan: "" }}
      historyRows={[
        "Session #3 - ROM improved",
        "Session #2 - Rehab plan adjusted",
        "Session #1 - Initial orthopedic assessment",
      ]}
    />
  );
}

