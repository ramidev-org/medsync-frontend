export type Sex = "male" | "female" ;
export type BloodType =
  | "A+"
  | "A-"
  | "B+"
  | "B-"
  | "AB+"
  | "AB-"
  | "O+"
  | "O-";

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
}

export interface Insurance {
  provider: string;
  policyNumber: string;
}

export interface MedicalInfo {
  height?: number;
  weight?: number;
  bloodType?: BloodType;
  allergies?: string[];
  chronicDiseases?: string[];
  medications?: string[];
  disabilities?: string[];
}  

export interface Patient {
  // Identification
  id: string;
  nationalId?: string;
  medicalRecordNumber?: string;

  // Personal information
  firstName: string;
  lastName: string;
  dateOfBirth: string; // ISO date (YYYY-MM-DD)
  placeOfBirth: string;
  age?: number;
  sex: Sex;

  // Contact
  phone?: string;
  email?: string;
  address?: Address;
  emergencyContact?: EmergencyContact;

  // Medical
  medicalInfo?: MedicalInfo;

  // Insurance
  insurance?: Insurance;

  // Metadata
  createdAt: string; // ISO timestamp
  updatedAt?: string;
}
