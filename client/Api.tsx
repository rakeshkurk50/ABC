// This file intentionally left minimal to avoid duplicate exports when building on case-sensitive FS.
// The real API surface is exported from `src/api.tsx` (lowercase). Keep this file to maintain compatibility
// with imports that reference `../Api` (uppercase) on case-insensitive dev machines.
export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export async function signup(data: any) {
  try {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });

    const json = await res.json();
    
    if (!res.ok) {
      throw new Error(json.message || 'Signup failed');
    }
    
    return json;
  } catch (error: any) {
    return { 
      success: false, 
      message: error.message || 'Network error occurred during signup. Please try again.'
    };
  }
}

export async function login(payload: { loginId: string; password: string }) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    mode: 'cors',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Login failed');
  }
  return res.json();
}

export async function verifyOtp(mobile: string, otp: string) {
  const res = await fetch(`${API_BASE}/auth/verify-otp`, {
    method: 'POST',
    mode: 'cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobile, otp })
  });
  return res.json();
}

export async function resendOtp(mobile: string) {
  const res = await fetch(`${API_BASE}/auth/resend-otp`, {
    method: 'POST',
    mode: 'cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobile })
  });
  return res.json();
}

export async function getAllUsers(token?: string) {
  const res = await fetch(`${API_BASE}/auth/all-users`, {
    method: 'GET',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to fetch users');
  }
  return res.json();
}

export async function sendOtp(mobile: string) {
  const res = await fetch(`${API_BASE}/auth/send-otp`, {
    method: 'POST',
    mode: 'cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobile })
  });
  return res.json();
}