import { apiClient } from "./client";
import { User } from "./types";

export interface AuthResponse {
  token: string;
  user: User;
}

export function login(email: string, password: string) {
  return apiClient
    .post<AuthResponse>("/api/auth/login", { email, password })
    .then((r) => r.data);
}

export function register(email: string, password: string, username: string) {
  return apiClient
    .post<AuthResponse>("/api/auth/register", { email, password, username })
    .then((r) => r.data);
}

export function googleLogin(idToken: string) {
  return apiClient.post<AuthResponse>("/api/auth/google", { idToken }).then((r) => r.data);
}

export function requestPhoneCode(phone: string) {
  return apiClient.post<{ ok: true }>("/api/auth/phone/request", { phone }).then((r) => r.data);
}

export function verifyPhoneCode(phone: string, code: string) {
  return apiClient
    .post<AuthResponse>("/api/auth/phone/verify", { phone, code })
    .then((r) => r.data);
}
