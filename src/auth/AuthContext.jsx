// src/auth/AuthContext.jsx
import { createContext, useEffect, useMemo, useState } from "react";
import { api } from "../api/api";

export const AuthContext = createContext(null);

const STORAGE_TOKEN = "virazul_token";
const STORAGE_USER = "virazul_user";

function mapErroApi(status, payload) {
  const code = payload?.erro;

  if (status === 409 && code === "email_ja_cadastrado")
    return "Este email já está cadastrado.";
  if (status === 401 && code === "credenciais_invalidas")
    return "Email ou senha inválidos.";
  if (status === 400) return "Dados inválidos. Verifique e tente novamente.";
  if (status === 500) return "Erro interno. Tente novamente em instantes.";
  return "Falha ao comunicar com a API.";
}

function normalizeMe(meResp) {
  // compat: /me pode retornar { usuario: {...} } ou direto {...}
  return meResp?.usuario ?? meResp ?? null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem(STORAGE_TOKEN);
    const storedUser = localStorage.getItem(STORAGE_USER);

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem(STORAGE_TOKEN);
        localStorage.removeItem(STORAGE_USER);
      }
    }
    setBooting(false);
  }, []);

  const login = async (email, senha) => {
    try {
      const data = await api.login(email, senha); // { token }
      const userToken = data?.token;

      if (!userToken) {
        return { success: false, error: "Token não recebido da API." };
      }

      const meResp = await api.getMe(userToken);
      const userData = normalizeMe(meResp);

      setUser(userData);
      setToken(userToken);
      localStorage.setItem(STORAGE_TOKEN, userToken);
      localStorage.setItem(STORAGE_USER, JSON.stringify(userData));
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: mapErroApi(error.status, error.payload),
      };
    }
  };

  const registrar = async (email, senha) => {
    try {
      // A API /auth/registrar NÃO retorna token, então:
      // 1) cria usuário
      await api.registrar(email, senha);

      // 2) faz login pra obter token
      const data = await api.login(email, senha);
      const userToken = data?.token;

      if (!userToken) {
        return { success: false, error: "Token não recebido da API." };
      }

      // 3) busca /me
      const meResp = await api.getMe(userToken);
      const userData = normalizeMe(meResp);

      setUser(userData);
      setToken(userToken);
      localStorage.setItem(STORAGE_TOKEN, userToken);
      localStorage.setItem(STORAGE_USER, JSON.stringify(userData));
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: mapErroApi(error.status, error.payload),
      };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(STORAGE_TOKEN);
    localStorage.removeItem(STORAGE_USER);
  };

  const value = useMemo(
    () => ({
      user,
      token,
      login,
      registrar,
      logout,
      isAuthenticated: !!token && !!user,
    }),
    [user, token]
  );

  if (booting) return null;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}