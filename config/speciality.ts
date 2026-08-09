export type SpecialityKey =
  | "general"
  | "general_medicine"
  | "cardiology"
  | "dermatology"
  | "gynecology"
  | "gynecology_obstetrics"
  | "orthopedics"
  | "pediatrics"
  | "dentistry"
  | "endocrinology_diabetes"
  | "ent"
  | "ophthalmology"
  | "pulmonology"
  | "gastroenterology"
  | "analyses_medicales";

const MAP: Record<string, SpecialityKey> = {
  // French
  "medecine generale": "general",
  generaliste: "general",
  "general practice": "general",
  "general medicine": "general_medicine",
  cardiologie: "cardiology",
  dermatologie: "dermatology",
  gynecologie: "gynecology",
  obstetrique: "gynecology_obstetrics",
  orthopedie: "orthopedics",
  orthopedique: "orthopedics",
  traumatologie: "orthopedics",
  pediatrie: "pediatrics",
  dentaire: "dentistry",
  dentisterie: "dentistry",
  odontologie: "dentistry",
  endocrinologie: "endocrinology_diabetes",
  diabete: "endocrinology_diabetes",
  ophtalmologie: "ophthalmology",
  pneumologie: "pulmonology",
  gastroenterologie: "gastroenterology",
  "analyses medicales": "analyses_medicales",

  // English
  cardiology: "cardiology",
  dermatology: "dermatology",
  gynecology: "gynecology",
  obstetrics: "gynecology_obstetrics",
  orthopedics: "orthopedics",
  orthopedic: "orthopedics",
  pediatrics: "pediatrics",
  dentistry: "dentistry",
  dentist: "dentistry",
  endocrinology: "endocrinology_diabetes",
  diabetes: "endocrinology_diabetes",
  ent: "ent",
  ophthalmology: "ophthalmology",
  pulmonology: "pulmonology",
  gastroenterology: "gastroenterology",
  "medical analyses": "analyses_medicales",
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
    case "gynecology_obstetrics":
      return "Gynecologie";
    case "orthopedics":
      return "Orthopedie";
    case "pediatrics":
      return "Pediatrie";
    case "dentistry":
      return "Dentisterie";
    case "general_medicine":
      return "Medecine generale";
    case "endocrinology_diabetes":
      return "Endocrinologie / Diabete";
    case "ent":
      return "ORL";
    case "ophthalmology":
      return "Ophtalmologie";
    case "pulmonology":
      return "Pneumologie";
    case "gastroenterology":
      return "Gastroenterologie";
    case "analyses_medicales":
      return "Analyses medicales";
    default:
      return "Medecine generale";
  }
};
