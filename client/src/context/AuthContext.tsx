import { createContext, useState, useCallback, type ReactNode } from 'react';
import * as authApi from '../api/auth';

export interface AuthUser {
  name: string;
  email: string;
  initials: string;
}

interface AuthState {
  token: string | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  adminLogin: (username: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const TOKEN_KEY = 'token';
const USER_KEY = 'tickethub_user';

function buildUser(email: string, name?: string): AuthUser {
  const displayName = (name?.trim() || email.split('@')[0]).replace(/[._]/g, ' ');
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  return { name: displayName, email, initials };
}

export const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem(TOKEN_KEY),
  );
  const [role, setRole] = useState<'user' | 'admin'>(
    () => (localStorage.getItem('auth_role') === 'admin' ? 'admin' : 'user')
  );
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  });

  const persistToken = (t: string, nextRole: 'user' | 'admin') => {
    localStorage.setItem(TOKEN_KEY, t);
    localStorage.setItem('auth_role', nextRole);
    setToken(t);
    setRole(nextRole);
  };

  const persistUser = (u: AuthUser) => {
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    setUser(u);
  };

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    persistToken(res.access_token, 'user');
    persistUser(buildUser(email));
  }, []);

  const adminLogin = useCallback(async (username: string, password: string) => {
    const res = await authApi.adminLogin(username, password);
    persistToken(res.access_token, 'admin');
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    const res = await authApi.signup(name, email, password);
    persistToken(res.access_token, 'user');
    persistUser(buildUser(email, name));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('auth_role');
    setToken(null);
    setUser(null);
    setRole('user');
  }, []);

  return (
    <AuthContext.Provider
      value={{ token, isLoggedIn: !!token, isAdmin: !!token && role === 'admin', user, login, adminLogin, signup, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}
