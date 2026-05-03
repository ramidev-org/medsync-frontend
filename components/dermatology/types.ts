export type BodySide = "front" | "back";

export type LesionMarker = {
  id: string;
  side: BodySide;
  x: number; // viewBox coordinate (0..100)
  y: number; // viewBox coordinate (0..200)
  label?: string;
  color?: string;
  createdAtIso: string;
};

export type DermatologyLesionEntry = {
  id: string;
  side: BodySide;
  region: string;
  morphology: string;
  sizeMm?: string;
  symptoms?: string;
  note?: string;
  createdAtIso: string;
};

export type DermatologyPhotoEntry = { id: string; uri: string; createdAtIso: string; note?: string };

export type DermatologyWorkspaceState = {
  side?: BodySide;
  markers?: LesionMarker[]; // legacy (visual marker workflow)
  lesions?: DermatologyLesionEntry[];
  photos?: DermatologyPhotoEntry[];
  region?: string;
  chiefComplaint?: string;
  notes?: string;
  assessment?: {
    diagnosis?: string;
    plan?: string;
    followUp?: string;
  };
};
