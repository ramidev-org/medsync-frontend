export type MockClinic = {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  assignedDoctorId?: string | null;
};

export const MOCK_CLINICS: MockClinic[] = [
  {
    id: "c1",
    name: "Clinique El Manar",
    code: "CLN-001",
    address: "12 Rue des Oliviers",
    city: "Alger",
    assignedDoctorId: "u3",
  },
  {
    id: "c2",
    name: "Cabinet Santé Plus",
    code: "CLN-002",
    address: "5 Avenue des Martyrs",
    city: "Oran",
    assignedDoctorId: null,
  },
  {
    id: "c3",
    name: "Polyclinique Atlas",
    code: "CLN-003",
    address: "44 Boulevard Central",
    city: "Constantine",
    assignedDoctorId: "u1",
  },
];
