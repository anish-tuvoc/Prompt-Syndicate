import { createContext, useState, useCallback, type ReactNode } from 'react';
import * as authApi from '../api/auth';

interface AuthState {
  token: string | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  adminLogin: (username: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem('token')
  );
  const [role, setRole] = useState<'user' | 'admin'>(
    () => (localStorage.getItem('auth_role') === 'admin' ? 'admin' : 'user')
  );

  const saveToken = (t: string, nextRole: 'user' | 'admin') => {
    localStorage.setItem('token', t);
    localStorage.setItem('auth_role', nextRole);
    setToken(t);
    setRole(nextRole);
  };

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    saveToken(res.access_token, 'user');
  }, []);

  const adminLogin = useCallback(async (username: string, password: string) => {
    const res = await authApi.adminLogin(username, password);
    saveToken(res.access_token, 'admin');
  }, []);

  const signup = useCallback(async (email: string, password: string) => {
    const res = await authApi.signup(email, password);
    saveToken(res.access_token, 'user');
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('auth_role');
    setToken(null);
    setRole('user');
  }, []);

  return (
    <AuthContext.Provider value={{ token, isLoggedIn: !!token, isAdmin: !!token && role === 'admin', login, adminLogin, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
