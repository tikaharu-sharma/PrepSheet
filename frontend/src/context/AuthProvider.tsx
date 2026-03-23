import React, { type ReactNode } from "react";
import { AuthContext } from "./AuthContext";
import { getStoredUser, isLoggedIn } from "../lib/auth";

type Props = { children: ReactNode };

export const AuthProvider: React.FC<Props> = ({ children }) => {
  const [user, setUser] = React.useState(isLoggedIn() ? getStoredUser() : null);

  React.useEffect(() => {
    const onAuthChanged = () => {
      setUser(isLoggedIn() ? getStoredUser() : null);
    };

    window.addEventListener('auth-changed', onAuthChanged);

    return () => {
      window.removeEventListener('auth-changed', onAuthChanged);
    };
  }, []);

  return <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>;
};