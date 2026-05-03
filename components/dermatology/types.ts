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

export type DermatologyWorkspaceState = {
  side?: BodySide;
  markers?: LesionMarker[];
  photos?: { id: string; uri: string; createdAtIso: string; note?: string }[];
};
