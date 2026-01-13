// src/models/User.ts
import { db } from "../database/database_conn";

export class User {
  id?: string;
  email: string;
  name: string;
  role: string;

  constructor(email: string, name: string, role: string, id?: string) {
    this.email = email;
    this.name = name;
    this.role = role;
    if (id) this.id = id;
  }

  async save() {
    if (this.id) {
      // update user
      const { data, error } = await db
        .from("users")
        .update({ email: this.email, name: this.name })
        .eq("id", this.id);
      if (error) throw error;
      return data;
    } else {
      // create user
      const { data, error } = await db
        .from("users")
        .insert({ email: this.email, name: this.name })
        .select();
      if (error) throw error;
      this.id = data[0].id;
      return data[0];
    }
  }

  static async getById(id: string) {
    const { data, error } = await db
      .from("users")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return new User(data.email, data.name, data.id);
  }
}
