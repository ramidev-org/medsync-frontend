export interface PatientMedicalInfo {
  id: string;
  patient_id: string;
  blood_type?: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
  allergies?: string[];
  chronic_diseases?: string[];
  medications?: string[];
  disabilities?: string[];
  created_at: string;
  updated_at?: string;
}

export interface PatientMeasurement {
  id: string;
  patient_id: string;
  recorded_by?: string;
  weight?: number;
  height?: number;
  bmi?: number;
  temperature?: number;
  systolic_bp?: number;
  diastolic_bp?: number;
  oxygen_saturation?: number;
  recorded_at: string;
  notes?: string;
}