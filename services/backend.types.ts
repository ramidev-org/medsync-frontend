export type UserType = "doctor" | "assistant";
export type Sex = "male" | "female";
export type MaritalStatus = "single" | "married" | "divorced";
export type BloodType = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
export type Priority = "low" | "normal" | "routine" | "urgent" | "high";
export type AppointmentType = "consultation" | "follow_up" | "emergency" | "procedure";
export type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
export type ConsultationStatus = "open" | "closed" | "cancelled";
export type PrescriptionStatus = "draft" | "signed" | "cancelled";
export type InvoiceStatus = "draft" | "issued" | "paid" | "partial" | "void" | "cancelled";
export type PaymentMethod = "cash" | "card" | "transfer" | "cheque" | "other";
export type PaymentStatus = "pending" | "paid" | "partial" | "refunded" | "cancelled";
export type LabPriority = "routine" | "urgent" | "stat";
export type LabOrderStatus = "draft" | "ordered" | "collected" | "partial" | "completed" | "cancelled";
export type LabResultStatus = "pending" | "collected" | "resulted" | "validated" | "cancelled";
export type TreatmentCaseStatus = "open" | "active" | "closed" | "archived" | "cancelled";

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

export type ConsultationRow = {
  id: string;
  clinic_id: string;
  appointment_id: string | null;
  patient_id: string;
  doctor_id: string;
  status: ConsultationStatus | string;
  observations: string | null;
  treatment_plan: string | null;
  follow_up: string | null;
  speciality_key: string | null;
  speciality_payload: any | null;
  shared_payload: any | null;
  treatment_case_id: string | null;
  parent_consultation_id: string | null;
  previous_consultation_id: string | null;
  session_number: number | null;
  session_type: string | null;
  is_parent: boolean | null;
  session_title: string | null;
  reason_for_visit: string | null;
  opened_at: string;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ConsultationVitalsRow = {
  id: string;
  consultation_id: string;
  weight: number | null;
  height: number | null;
  temperature: number | null;
  systolic_bp: number | null;
  diastolic_bp: number | null;
  oxygen_saturation: number | null;
  bmi: number | null;
  recorded_at: string;
  created_at: string;
  updated_at: string;
};

export type ConsultationParametersRow = {
  id: string;
  consultation_id: string;
  motif_consultation: string | null;
  glycemie: string | null;
  hba1c: string | null;
  examen_clinique: string | null;
  conclusion: string | null;
  created_at: string;
  updated_at: string;
};

export type ConsultationDiagnosisRow = {
  id: string;
  consultation_id: string;
  code: string | null;
  label: string;
  notes: string | null;
  created_at: string;
};

export type ConsultationDocumentRow = {
  id: string;
  clinic_id: string;
  consultation_id: string;
  patient_id: string;
  uploader_id: string | null;
  kind: string;
  name: string;
  mime_type: string | null;
  url: string | null;
  size_bytes: number | null;
  sha256: string | null;
  study_instance_uid: string | null;
  series_instance_uid: string | null;
  sop_instance_uid: string | null;
  accession_number: string | null;
  metadata: any | null;
  created_at: string;
  updated_at: string;
  treatment_case_id: string | null;
  document_type: string | null;
  title: string | null;
  notes: string | null;
};

export type ConsultationEventRow = {
  id: string;
  clinic_id: string;
  consultation_id: string;
  actor_id: string | null;
  event_type: string;
  payload: any | null;
  created_at: string;
};

export type ConsultationSession = {
  consultation: ConsultationRow;
  vitals: ConsultationVitalsRow | null;
  parameters: ConsultationParametersRow | null;
  diagnoses: ConsultationDiagnosisRow[];
  documents: ConsultationDocumentRow[];
  events?: ConsultationEventRow[];
};

export type ClinicSpecialityToolRow = {
  id: string;
  clinic_id: string;
  speciality_key: string;
  tool_type: string;
  label: string | null;
  base_url: string | null;
  config: any | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type ClinicServiceRow = {
  id: string;
  clinic_id: string;
  code: string | null;
  name: string;
  category: string | null;
  color: string | null;
  duration_minutes: number | null;
  price: number | null;
  cost: number | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type ClinicInvoiceRow = {
  id: string;
  clinic_id: string;
  patient_id: string;
  appointment_id: string | null;
  status: InvoiceStatus;
  subtotal: number;
  discount: number;
  total: number;
  paid_amount: number;
  issued_at: string | null;
  created_at: string;
  updated_at: string;
  // denormalized for list rendering
  patient_first_name?: string | null;
  patient_last_name?: string | null;
};

export type ClinicExpenseRow = {
  id: string;
  clinic_id: string;
  category: string | null;
  amount: number;
  notes: string | null;
  spent_at: string;
  created_at: string;
};

export type InventoryItemRow = {
  id: string;
  clinic_id: string;
  sku: string | null;
  name: string;
  unit: string | null;
  qty_on_hand: number;
  reorder_threshold: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type InventoryListResponse = {
  items: InventoryItemRow[];
  total: number;
  page: number;
  itemsPerPage: number;
};

export type ConversationMemberMini = {
  id: string;
  full_name: string | null;
  user_type: UserType;
};

export type ConversationLastMessageMini = {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
} | null;

export type ConversationRow = {
  id: string;
  clinic_id: string;
  kind: "direct" | "group" | string;
  title: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  last_message: ConversationLastMessageMini;
  members: ConversationMemberMini[];
};

export type ConversationsListResponse = {
  conversations: ConversationRow[];
  total: number;
  page: number;
  itemsPerPage: number;
};

export type ChatMessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string | null;
  body: string;
  created_at: string;
  edited_at: string | null;
};
