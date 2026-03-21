import { api } from './client';

export interface AuthToken {
  access_token: string;
  token_type: string;
}

export function signup(name: string, email: string, password: string) {
  return api.post<AuthToken>('/auth/signup', { name, email, password });
}

export function login(email: string, password: string) {
  return api.post<AuthToken>('/auth/login', { email, password });
}

export function adminLogin(username: string, password: string) {
  return api.post<AuthToken>('/auth/admin-login', { username, password });
}
