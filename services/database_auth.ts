// src/services/auth.ts
import { db } from "../database/database_conn";
import { IS_DEMO } from "@/config/runtime";

export async function signUp(email: string, password: string) {
  if (IS_DEMO) return { id: "demo", email } as any;
  const { data, error } = await db.auth.signUp({ email, password });
  if (error) throw error;
  return data.user;
}

export async function signIn(email: string, password: string) {
  if (IS_DEMO) return { id: "demo", email } as any;
  const { data, error } = await db.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

export async function signOut() {
  if (IS_DEMO) return;
  const { error } = await db.auth.signOut();
  if (error) throw error;
}
