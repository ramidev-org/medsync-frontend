// src/models/User.ts
import { db } from "../database/database_conn";



export class User {
  id?: string;
  email: string;
  username: string;
  fullname: string; // Keep the property as `fullname` in the app
  role: string;

  constructor(
    email: string,
    username: string,
    fullname: string,
    role: string,
    id?: string
  ) {
    this.email = email;
    this.username = username;
    this.fullname = fullname;
    this.role = role;
    if (id) this.id = id;
  }

  async save() {
    if (!this.id) {
      throw new Error("Cannot save user without id");
    }

    const { error } = await db
      .from("profiles")
      .update({
        email: this.email,
        username: this.username,
        full_name: this.fullname, // map to DB column
        role: this.role,
      })
      .eq("id", this.id);

    if (error) throw error;
  }

  static fromDb(data: any) {
    return new User(
      data.email,
      data.username,
      data.full_name, // map DB column to class property
      data.role,
      data.id
    );
  }

  static async getById(id: string) {
    const { data, error } = await db
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return User.fromDb(data);
  }
}
