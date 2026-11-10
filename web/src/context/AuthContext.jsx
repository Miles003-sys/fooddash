import { useEffect, useState } from "react";
import api from "../services/api";
import { AuthContext } from "./AuthContextValue";

const TOKEN_KEY = "fooddash_token";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // While a saved token is being verified, "loading" stays true
  const [loading, setLoading] = useState(
    () => !!localStorage.getItem(TOKEN_KEY),
  );

  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) return;

    api
      .get("/auth/me")
      .then((res) => setUser(res.data.user))
      .catch((err) => {
        // Only discard the token if the server says it is invalid or expired
        if (err.response?.status === 401) {
          localStorage.removeItem(TOKEN_KEY);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const saveSession = ({ token, user }) => {
    localStorage.setItem(TOKEN_KEY, token);
    setUser(user);
  };

  const register = async (data) => {
    try {
      const res = await api.post("/auth/register", data);
      saveSession(res.data);
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: err.response?.data?.message || "Could not reach the server",
      };
    }
  };

  const login = async (data) => {
    try {
      const res = await api.post("/auth/login", data);
      saveSession(res.data);
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: err.response?.data?.message || "Could not reach the server",
      };
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
