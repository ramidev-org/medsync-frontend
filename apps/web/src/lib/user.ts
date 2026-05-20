export type DoctorProfile = {
  speciality: string;
  license_number: string;
  years_of_experience: number;
  consultation_fee: number;
  bio: string;
  active: boolean;
};

export type AssistantProfile = {
  department: string;
  shift_start: string;
  shift_end: string;
  active: boolean;
};

export type AppUser = {
  id: string;
  email: string;
  username: string;
  fullname: string;
  user_type: "doctor" | "assistant";
  clinic_id: string;
  doctorProfile: DoctorProfile | null;
  assistantProfile: AssistantProfile | null;
};

export type DbRecord = Record<string, unknown>;

export function mapUserFromDb(data: DbRecord): AppUser {
  const userType = String(data.user_type ?? "").toLowerCase();

  return {
    id: String(data.id),
    email: typeof data.email === "string" ? data.email : "",
    username: typeof data.username === "string" ? data.username : "",
    fullname: typeof data.full_name === "string" ? data.full_name : "",
    user_type: userType === "doctor" ? "doctor" : "assistant",
    clinic_id: typeof data.clinic_id === "string" ? data.clinic_id : "",
    doctorProfile: (data.doctor_profiles as DoctorProfile | null | undefined) ?? null,
    assistantProfile:
      (data.assistant_profiles as AssistantProfile | null | undefined) ?? null,
  };
}
