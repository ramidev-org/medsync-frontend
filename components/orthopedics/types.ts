export type OrthoJoint =
  | "neck"
  | "shoulder_left"
  | "shoulder_right"
  | "elbow_left"
  | "elbow_right"
  | "wrist_left"
  | "wrist_right"
  | "hip_left"
  | "hip_right"
  | "knee_left"
  | "knee_right"
  | "ankle_left"
  | "ankle_right";

export type RangeOfMotion = {
  joint: OrthoJoint;
  flexionDeg?: number | null;
  extensionDeg?: number | null;
  abductionDeg?: number | null;
  adductionDeg?: number | null;
  note?: string;
};

export type OrthopedicsWorkspaceState = {
  selectedJoint?: OrthoJoint | null;
  rom?: Partial<Record<OrthoJoint, RangeOfMotion>>;
  romLog?: OrthoRomEntry[];
};

export type OrthoRomEntry = {
  id: string;
  joint: OrthoJoint;
  atIso: string;
  value: RangeOfMotion;
};
