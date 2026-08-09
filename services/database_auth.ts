// src/services/auth.ts
import { db } from "../database/database_conn";

export async function signUp(email: string, password: string) {
  const { data, error } = await db.auth.signUp({ email, password });
  if (error) throw error;
  return data.user;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await db.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

export async function signOut() {
  const { error } = await db.auth.signOut();
  if (error) throw error;
}
