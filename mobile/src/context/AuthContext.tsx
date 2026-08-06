import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { secureStorage } from "../lib/secureStorage";
import { TOKEN_KEY } from "../api/client";
import {
  forgotPassword as apiForgotPassword,
  googleLogin as apiGoogleLogin,
  login as apiLogin,
  register as apiRegister,
  requestPhoneCode as apiRequestPhoneCode,
  resetPassword as apiResetPassword,
  verifyPhoneCode as apiVerifyPhoneCode,
} from "../api/auth";
import { User } from "../api/types";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  requestPhoneCode: (phone: string) => Promise<void>;
  verifyPhoneCode: (phone: string, code: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const USER_KEY = "ff_auth_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [token, storedUser] = await Promise.all([
          secureStorage.getItem(TOKEN_KEY),
          secureStorage.getItem(USER_KEY),
        ]);
        if (token && storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  async function persistSession(token: string, nextUser: User) {
    await secureStorage.setItem(TOKEN_KEY, token);
    await secureStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      login: async (email, password) => {
        const res = await apiLogin(email, password);
        await persistSession(res.token, res.user);
      },
      register: async (email, password, username) => {
        const res = await apiRegister(email, password, username);
        await persistSession(res.token, res.user);
      },
      loginWithGoogle: async (idToken) => {
        const res = await apiGoogleLogin(idToken);
        await persistSession(res.token, res.user);
      },
      requestPhoneCode: async (phone) => {
        await apiRequestPhoneCode(phone);
      },
      verifyPhoneCode: async (phone, code) => {
        const res = await apiVerifyPhoneCode(phone, code);
        await persistSession(res.token, res.user);
      },
      forgotPassword: async (email) => {
        await apiForgotPassword(email);
      },
      resetPassword: async (email, code, newPassword) => {
        const res = await apiResetPassword(email, code, newPassword);
        await persistSession(res.token, res.user);
      },
      logout: async () => {
        await secureStorage.deleteItem(TOKEN_KEY);
        await secureStorage.deleteItem(USER_KEY);
        setUser(null);
      },
    }),
    [user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
