export type Sex = "male" | "female";

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  sex: Sex;
}
