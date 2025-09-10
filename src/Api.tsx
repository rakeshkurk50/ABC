// Base API URL (from .env or fallback)
export const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ----------------------
// Types
// ----------------------
export interface SignupData {
  name: string;
  email: string;
  password: string;
  mobile: string;
}

export interface LoginPayload {
  loginId: string;
  password: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  token?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  mobile: string;
}

// ----------------------
// API Calls
// ----------------------

// ✅ Signup
export async function signup(
  data: SignupData
): Promise<ApiResponse<User>> {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

// ✅ Login
export async function login(
  payload: LoginPayload
): Promise<ApiResponse<{ token: string }>> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

// ✅ Verify OTP
export async function verifyOtp(
  mobile: string,
  otp: string
): Promise<ApiResponse<{ verified: boolean }>> {
  const res = await fetch(`${API_BASE}/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mobile, otp }),
  });
  return res.json();
}

// ✅ Resend OTP
export async function resendOtp(
  mobile: string
): Promise<ApiResponse<{ sent: boolean }>> {
  const res = await fetch(`${API_BASE}/auth/resend-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mobile }),
  });
  return res.json();
}

// ✅ Get all users
export async function getAllUsers(
  token?: string
): Promise<ApiResponse<User[]>> {
  const res = await fetch(`${API_BASE}/auth/all-users`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  return res.json();
}
