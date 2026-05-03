export type WorkspaceDef = {
  key: string;
  name: string;
  tools: string[];
};

export const dermatologyWorkspace: WorkspaceDef = {
  key: "dermatology",
  name: "Dermatology",
  tools: ["body-map", "lesion-marker", "photo-timeline", "before-after-viewer"],
};

export const orthopedicsWorkspace: WorkspaceDef = {
  key: "orthopedics",
  name: "Orthopedics",
  tools: ["skeleton-map", "joint-selector", "dicom-viewer", "range-of-motion-panel"],
};

export const cardiologyWorkspace: WorkspaceDef = {
  key: "cardiology",
  name: "Cardiology",
  tools: ["ecg-viewer", "echo-measurements", "heart-sounds-player", "risk-score-calculators"],
};

export const gynecologyWorkspace: WorkspaceDef = {
  key: "gynecology",
  name: "Gynecology / OB",
  tools: ["pregnancy-wheel", "pelvic-diagram", "ultrasound-gallery", "pap-smear-tracker"],
};

export const pediatricsWorkspace: WorkspaceDef = {
  key: "pediatrics",
  name: "Pediatrics",
  tools: ["growth-charts", "vaccine-schedule", "pediatric-dosage-calculator", "developmental-milestones"],
};

export const ophthalmologyWorkspace: WorkspaceDef = {
  key: "ophthalmology",
  name: "Ophthalmology",
  tools: ["eye-diagram", "visual-acuity-log", "fundus-photo-viewer", "slit-lamp-notes"],
};

export const entWorkspace: WorkspaceDef = {
  key: "ent",
  name: "ENT",
  tools: ["ear-diagram", "audiogram-viewer", "sinus-diagram", "otoscopy-gallery"],
};

export const neurologyWorkspace: WorkspaceDef = {
  key: "neurology",
  name: "Neurology",
  tools: ["neuro-exam-checklist", "reflex-map", "stroke-scale", "seizure-log"],
};

export const pulmonologyWorkspace: WorkspaceDef = {
  key: "pulmonology",
  name: "Pulmonology",
  tools: ["spirometry-viewer", "peak-flow-tracker", "inhaler-technique-checklist", "asthma-control-test"],
};

export const dentistryWorkspace: WorkspaceDef = {
  key: "dentistry",
  name: "Dentistry",
  tools: ["odontogram", "dental-xray-viewer", "tooth-treatment-panel"],
};

export const WORKSPACES: WorkspaceDef[] = [
  dermatologyWorkspace,
  orthopedicsWorkspace,
  cardiologyWorkspace,
  gynecologyWorkspace,
  pediatricsWorkspace,
  ophthalmologyWorkspace,
  entWorkspace,
  neurologyWorkspace,
  pulmonologyWorkspace,
  dentistryWorkspace,
];

