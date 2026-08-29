export type ToothId = string;

// Standard 5-surface model for charting
export type ToothSurface = "O" | "M" | "D" | "B" | "L";

export type ProcedureKey =
  | "healthy"
  | "caries"
  | "filling"
  | "crown"
  | "root_canal"
  | "extraction"
  | "implant"
  | "sealant"
  | "watch"
  | "other";

export type TreatmentRecord = {
  id: string;
  at: string; // ISO string
  tooth: ToothId;
  surface: ToothSurface;
  procedure: ProcedureKey;
  note?: string;
};

export type SurfaceChart = {
  procedure?: ProcedureKey;
  history?: TreatmentRecord[];
};

export type ToothChart = Partial<Record<ToothSurface, SurfaceChart>>;

export type OdontogramState = Partial<Record<ToothId, ToothChart>>;

export const ALL_SURFACES: ToothSurface[] = ["B", "L", "M", "D", "O"];

export const PROCEDURES: { key: ProcedureKey; label: string; color: string }[] = [
  { key: "healthy", label: "Healthy", color: "#16A34A" },
  { key: "caries", label: "Caries", color: "#DC2626" },
  { key: "filling", label: "Filling", color: "#2563EB" },
  { key: "crown", label: "Crown", color: "#7C3AED" },
  { key: "root_canal", label: "Root canal", color: "#F97316" },
  { key: "extraction", label: "Extraction", color: "#6B7280" },
  { key: "implant", label: "Implant", color: "#0EA5E9" },
  { key: "sealant", label: "Sealant", color: "#EAB308" },
  { key: "watch", label: "Watch", color: "#F59E0B" },
  { key: "other", label: "Other", color: "#111827" },
];

export function procedureColor(procedure?: ProcedureKey) {
  if (!procedure) return "transparent";
  return PROCEDURES.find((p) => p.key === procedure)?.color ?? "#111827";
}

export function surfaceProcedure(state: OdontogramState, tooth: ToothId, surface: ToothSurface): ProcedureKey | undefined {
  return state[tooth]?.[surface]?.procedure;
}

export function upsertProcedure({
  odontogram,
  tooth,
  surface,
  procedure,
  note,
  nowIso,
}: {
  odontogram: OdontogramState;
  tooth: ToothId;
  surface: ToothSurface;
  procedure: ProcedureKey;
  note?: string;
  nowIso: string;
}): OdontogramState {
  const prevTooth = odontogram[tooth] ?? {};
  const prevSurface = prevTooth[surface] ?? {};
  if (prevSurface.procedure === procedure && !note) return odontogram;
  const nextRecord: TreatmentRecord = {
    id: `${tooth}-${surface}-${nowIso}`,
    at: nowIso,
    tooth,
    surface,
    procedure,
    note,
  };

  return {
    ...odontogram,
    [tooth]: {
      ...prevTooth,
      [surface]: {
        ...prevSurface,
        procedure,
        history: [...(prevSurface.history ?? []), nextRecord].slice(-50),
      },
    },
  };
}

export function clearSurface({
  odontogram,
  tooth,
  surface,
}: {
  odontogram: OdontogramState;
  tooth: ToothId;
  surface: ToothSurface;
}): OdontogramState {
  const prevTooth = odontogram[tooth];
  if (!prevTooth?.[surface]) return odontogram;

  const nextTooth: ToothChart = { ...prevTooth };
  const nextSurface: SurfaceChart = { ...(nextTooth[surface] ?? {}) };
  delete nextSurface.procedure;
  nextTooth[surface] = nextSurface;

  return { ...odontogram, [tooth]: nextTooth };
}
