// src/models/User.ts
//import { db } from "../database/database_conn";

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

export class User {
  id: string;
  email: string;
  username: string;
  fullname: string;
  role: "admin" | "doctor" | "assistant" | "clinic";
  clinic_id:string;

  doctorProfile: DoctorProfile | null;
  assistantProfile: AssistantProfile | null;

  constructor(params: {
    id: string;
    email: string;
    username: string;
    fullname: string;
    role: any;
    clinic_id:string;
    doctorProfile?: DoctorProfile | null;
    assistantProfile?: AssistantProfile | null;
  }) {
    this.id = params.id;
    this.email = params.email;
    this.username = params.username;
    this.fullname = params.fullname;
    this.role = params.role;
    this.clinic_id= params.clinic_id;
    this.doctorProfile = params.doctorProfile ?? null;
    this.assistantProfile = params.assistantProfile ?? null;
  }

  static fromDb(data: any): User {
    const role = data.user_roles?.[0]?.role;

    return new User({
      id: data.id,
      email: data.email,
      username: data.username,
      fullname: data.full_name,
      role,
      clinic_id: data.clinic_id,
      doctorProfile: data.doctor_profiles ?? null,
      assistantProfile: data.assistant_profiles ?? null,
    });
  }
}
