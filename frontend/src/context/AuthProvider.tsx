import React, { type ReactNode } from "react";
import { AuthContext } from "./AuthContext";
import { getStoredUser } from "../lib/auth";

type Props = { children: ReactNode };

export const AuthProvider: React.FC<Props> = ({ children }) => {
  const [user, setUser] = React.useState(getStoredUser());

  React.useEffect(() => {
    const onAuthChanged = () => {
      setUser(getStoredUser());
    };

    window.addEventListener('auth-changed', onAuthChanged);

    return () => {
      window.removeEventListener('auth-changed', onAuthChanged);
    };
  }, []);

  return <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>;
};