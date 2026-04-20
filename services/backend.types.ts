export type UserType = "doctor" | "assistant";

export type UsersMetadataRow = {
  id: string;
  username: string | null;
  full_name: string | null;
  email: string | null;
  clinic_id: string | null;
  active: boolean | null;
  created_at: string | null;
  user_type: UserType;
};

export type DoctorProfileRow = {
  id: string;
  speciality: string | null;
  license_number: string | null;
  years_of_experience: number | null;
  consultation_fee: number | null;
  bio: string | null;
  active: boolean | null;
};

export type AssistantProfileRow = {
  id: string;
  department: string | null;
  shift_start: string | null;
  shift_end: string | null;
  active: boolean | null;
};

export type ActivateClinicBody = {
  token: string;
  email: string;
  password: string;
  full_name: string;
  username?: string;
  clinic_name: string;
  clinic_code?: string;
  state?: string;
  city?: string;
  street?: string;
  google_maps_address?: string;
  speciality?: string;
  license_number?: string;
  years_of_experience?: number;
  consultation_fee?: number;
  bio?: string;
};

export type CreateStaffInviteBody = {
  email: string;
  user_type: UserType;
};

export type AcceptStaffInviteBody = {
  token: string;
  email: string;
  password: string;
  full_name: string;
  username?: string;
  speciality?: string;
  license_number?: string;
  years_of_experience?: number;
  consultation_fee?: number;
  bio?: string;
  department?: string;
  shift_start?: string;
  shift_end?: string;
};

export type ActivationLinkStatus = {
  // Preferred shape (matches current RPCs)
  valid?: boolean;
  reason?: string;
  email?: string | null;
  tier_plan?: string | null;
  doctors_limit?: number | null;
  assistants_limit?: number | null;

  // Backward-compat shape (older deployments)
  status?: "valid" | "invalid" | "expired" | "used";
  clinic_name?: string | null;
  clinic_code?: string | null;
};

export type StaffInviteStatus = {
  // Preferred shape (matches current RPCs)
  valid?: boolean;
  reason?: string;
  user_type?: UserType | null;
  email?: string | null;
  clinic_id?: string | null;
  clinic_name?: string | null;

  // Backward-compat shape (older deployments)
  status?: "valid" | "invalid" | "expired" | "accepted";
};
