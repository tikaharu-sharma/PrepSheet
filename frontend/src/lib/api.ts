import type { User } from './auth';

const API_BASE_URL = 'http://localhost:8080/api';

export interface LoginResponse {
  token: string;
  user: User;
}

export interface ApiError {
  message: string;
  status: number;
}

export async function loginUser(identifier: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email: identifier, password }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Login failed' }));
    throw {
      message: errorData.message || 'Login failed',
      status: response.status,
    } as ApiError;
  }

  const data = await response.json();

  return {
    token: data.token,
    user: {
      id: data.user_id,
      name: data.name,
      email: data.email,
      role: data.role,
    },
  };
}
