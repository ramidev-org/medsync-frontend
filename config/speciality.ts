export type SpecialityKey =
  | "general"
  | "cardiology"
  | "dermatology"
  | "gynecology"
  | "pediatrics"
  | "dentistry";

const MAP: Record<string, SpecialityKey> = {
  // French
  "medecine generale": "general",
  generaliste: "general",
  "general practice": "general",
  cardiologie: "cardiology",
  dermatologie: "dermatology",
  gynecologie: "gynecology",
  pediatrie: "pediatrics",
  dentaire: "dentistry",
  dentisterie: "dentistry",
  odontologie: "dentistry",

  // English
  cardiology: "cardiology",
  dermatology: "dermatology",
  gynecology: "gynecology",
  pediatrics: "pediatrics",
  dentistry: "dentistry",
  dentist: "dentistry",
};

export const normalizeSpeciality = (raw?: string | null): SpecialityKey => {
  const k = String(raw ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return MAP[k] ?? "general";
};

export const specialityLabelFr = (key: SpecialityKey) => {
  switch (key) {
    case "cardiology":
      return "Cardiologie";
    case "dermatology":
      return "Dermatologie";
    case "gynecology":
      return "Gynecologie";
    case "pediatrics":
      return "Pediatrie";
    case "dentistry":
      return "Dentisterie";
    default:
      return "Medecine generale";
  }
};
