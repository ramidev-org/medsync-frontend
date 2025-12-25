export type UserRole = "dentist" | "worker" | "admin";

export interface Profile {
  id: string;
  fullName: string;
  role: UserRole;
  email?: string;
}
