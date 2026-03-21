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
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  /** Mock login — no backend required. Stores a fake token + user in localStorage. */
  mockLogin: (email: string, name?: string) => void;
  logout: () => void;
}

const TOKEN_KEY = 'token';
const USER_KEY = 'tickethub_user';
const MOCK_TOKEN = 'mock_tickethub';

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

  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  });

  const persistToken = (t: string) => {
    localStorage.setItem(TOKEN_KEY, t);
    setToken(t);
  };

  const persistUser = (u: AuthUser) => {
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    setUser(u);
  };

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    persistToken(res.access_token);
    persistUser(buildUser(email));
  }, []);

  const signup = useCallback(async (email: string, password: string) => {
    const res = await authApi.signup(email, password);
    persistToken(res.access_token);
    persistUser(buildUser(email));
  }, []);

  const mockLogin = useCallback((email: string, name?: string) => {
    persistUser(buildUser(email, name));
    persistToken(MOCK_TOKEN);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ token, isLoggedIn: !!token, user, login, signup, mockLogin, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}
