export type SpecialityKey =
  | "general"
  | "cardiology"
  | "dermatology"
  | "gynecology"
  | "pediatrics";

const MAP: Record<string, SpecialityKey> = {
  // French
  "médecine générale": "general",
  "generaliste": "general",
  "généraliste": "general",
  cardiologie: "cardiology",
  dermatologie: "dermatology",
  gynécologie: "gynecology",
  pediatrie: "pediatrics",
  pédiatrie: "pediatrics",

  // English
  "general practice": "general",
  cardiology: "cardiology",
  dermatology: "dermatology",
  gynecology: "gynecology",
  pediatrics: "pediatrics",
};

export const normalizeSpeciality = (raw?: string | null): SpecialityKey => {
  const k = String(raw ?? "").trim().toLowerCase();
  return MAP[k] ?? "general";
};

export const specialityLabelFr = (key: SpecialityKey) => {
  switch (key) {
    case "cardiology":
      return "Cardiologie";
    case "dermatology":
      return "Dermatologie";
    case "gynecology":
      return "Gynécologie";
    case "pediatrics":
      return "Pédiatrie";
    default:
      return "Médecine générale";
  }
};
