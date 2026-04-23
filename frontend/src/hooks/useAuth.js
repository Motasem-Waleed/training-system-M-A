import { useEffect, useState } from "react";
import { clearStoredUser, readStoredUser, writeStoredUser } from "../utils/session";

export default function useAuth() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = readStoredUser();
    if (savedUser?.id || savedUser?.name || savedUser?.role) {
      setUser(savedUser);
    }
  }, []);

  const login = (role) => {
    const fakeUser = {
      name: "Test User",
      role,
    };

    writeStoredUser(fakeUser);
    setUser(fakeUser);
  };

  const logout = () => {
    clearStoredUser();
    setUser(null);
  };

  return { user, login, logout };
}
