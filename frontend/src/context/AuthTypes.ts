export type Role = "admin" | "manager" | "user";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
};