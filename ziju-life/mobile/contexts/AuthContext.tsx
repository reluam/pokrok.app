import React, { createContext, useContext, useEffect, useState } from "react";
import { getToken, setToken, clearToken } from "@/api/client";
import { checkSession } from "@/api/auth";
import { checkAccess } from "@/api/laborator";

interface AuthState {
  isLoading: boolean;
  isLoggedIn: boolean;
  hasSubscription: boolean;
  email: string | null;
}

interface AuthContextType extends AuthState {
  login: (token: string, email: string) => Promise<void>;
  logout: () => Promise<void>;
  recheckSubscription: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isLoading: true,
    isLoggedIn: false,
    hasSubscription: false,
    email: null,
  });

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (!token) {
        setState({ isLoading: false, isLoggedIn: false, hasSubscription: false, email: null });
        return;
      }

      try {
        const session = await checkSession();
        if (!session.loggedIn) {
          await clearToken();
          setState({ isLoading: false, isLoggedIn: false, hasSubscription: false, email: null });
          return;
        }

        let hasAccess = false;
        let accessEmail = session.email || null;
        try {
          const access = await checkAccess();
          hasAccess = access.valid;
          accessEmail = access.email || accessEmail;
        } catch {
          // Network error checking subscription — assume valid, recheck later
          hasAccess = true;
        }

        setState({
          isLoading: false,
          isLoggedIn: true,
          hasSubscription: hasAccess,
          email: accessEmail,
        });
      } catch {
        // Network error — keep token, assume logged in (token is still valid JWT)
        setState({ isLoading: false, isLoggedIn: true, hasSubscription: true, email: null });
      }
    })();
  }, []);

  const login = async (token: string, email: string) => {
    await setToken(token);
    const access = await checkAccess();
    setState({
      isLoading: false,
      isLoggedIn: true,
      hasSubscription: access.valid,
      email,
    });
  };

  const logout = async () => {
    await clearToken();
    setState({ isLoading: false, isLoggedIn: false, hasSubscription: false, email: null });
  };

  const recheckSubscription = async (): Promise<boolean> => {
    try {
      const access = await checkAccess();
      setState((prev) => ({ ...prev, hasSubscription: access.valid }));
      return access.valid;
    } catch {
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, recheckSubscription }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
