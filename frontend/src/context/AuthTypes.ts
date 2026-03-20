export type Role = "manager" | "employee";

export type User = {
  id: number;
  name: string;
  email: string;
  role: Role;
};