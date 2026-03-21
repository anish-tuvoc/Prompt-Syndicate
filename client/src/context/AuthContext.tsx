import { createContext, useState, useCallback, type ReactNode } from 'react';
import * as authApi from '../api/auth';

interface AuthState {
  token: string | null;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem('token')
  );

  const saveToken = (t: string) => {
    localStorage.setItem('token', t);
    setToken(t);
  };

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    saveToken(res.access_token);
  }, []);

  const signup = useCallback(async (email: string, password: string) => {
    const res = await authApi.signup(email, password);
    saveToken(res.access_token);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, isLoggedIn: !!token, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
