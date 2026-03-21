// src/context/AuthContext.ts
import { createContext, useContext } from "react";
import type { User } from "./AuthTypes";

export type AuthContextType = {
  user: User | null;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};