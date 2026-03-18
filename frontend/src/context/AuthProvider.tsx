import React, { type ReactNode } from "react";
import { AuthContext } from "./AuthContext";
import type { User } from "./AuthTypes";

type Props = { children: ReactNode };

export const AuthProvider: React.FC<Props> = ({ children }) => {
  // MOCK USER (replace with backend integration later)
  const user: User = {
    id: "user-1",
    name: "Jane Doe",
    email: "jane@email.com",
    role: "admin",
  };

  return <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>;
};