export type Sex = "male" | "female";
export type BloodType =
  | "A+"
  | "A-"
  | "B+"
  | "B-"
  | "AB+"
  | "AB-"
  | "O+"
  | "O-";
export type MaritalStatus = "single" | "married" | "divorced";

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
  bloodType?: BloodType;
  allergies?: string[];
  chronicDiseases?: string[];
  medications?: string[];
  disabilities?: string[];
}

export interface Patient {
  // Identification
  id: string;
  created_by: string;
  national_id?: string;
  medical_record_number?: string;

  // Personal information
  first_name: string;
  last_name: string;
  date_of_birth: string; // ISO date (YYYY-MM-DD)
  place_of_birth: string;
  age?: number;
  sex: Sex;
  marital_status: MaritalStatus;

  // Contact
  phone?: string;
  email?: string;
  address_street?: string;
  address_city?: string;
  address_state?: string;
  emergency_contact_name?: string;
  emergency_contact_relationship?: string;
  emergency_contact_phone?: string;

  // Insurance
  insurance_provider?: string;
  insurance_policy_number?: string;

  // Metadata
  created_at: string; // ISO timestamp
  updated_at?: string;
}
