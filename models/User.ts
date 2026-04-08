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

export type ReceptionProfile = {
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
  role: "doctor" | "reception";
  clinic_id:string;

  doctorProfile: DoctorProfile | null;
  receptionProfile: ReceptionProfile | null;

  constructor(params: {
    id: string;
    email: string;
    username: string;
    fullname: string;
    role: any;
    clinic_id:string;
    doctorProfile?: DoctorProfile | null;
    receptionProfile?: ReceptionProfile | null;
  }) {
    this.id = params.id;
    this.email = params.email;
    this.username = params.username;
    this.fullname = params.fullname;
    this.role = params.role;
    this.clinic_id= params.clinic_id;
    this.doctorProfile = params.doctorProfile ?? null;
    this.receptionProfile = params.receptionProfile ?? null;
  }

  static fromDb(data: any): User {
    const rawRole = data.user_roles?.[0]?.role;
    const role = rawRole === "assistant" ? "reception" : rawRole;

    return new User({
      id: data.id,
      email: data.email,
      username: data.username,
      fullname: data.full_name,
      role,
      clinic_id: data.clinic_id,
      doctorProfile: data.doctor_profiles ?? null,
      receptionProfile: data.reception_profiles ?? data.assistant_profiles ?? null,
    });
  }
}
