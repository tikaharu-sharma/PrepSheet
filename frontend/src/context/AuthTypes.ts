export type Role = "manager" | "employee";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
};