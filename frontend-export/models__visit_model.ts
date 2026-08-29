import { Patient } from "./patient_model";

export interface Visit {
  id: string;
  amount?: number | null;
  notes?: string | null;
  completed: boolean;
  createdAt: string;

  patient: Patient;
  createdBy: string;
}
