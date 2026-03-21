import type { User } from './auth';
import type { Restaurant } from './types';

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

function authHeaders(contentType?: string): Record<string, string> {
  const token = localStorage.getItem('prepsheet_token');
  return {
    'Content-Type': contentType || 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function fetchRestaurants(): Promise<Restaurant[]> {
  const response = await fetch(`${API_BASE_URL}/restaurants`, {
    method: 'GET',
    headers: authHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to fetch restaurants' }));
    throw {
      message: errorData.message || 'Failed to fetch restaurants',
      status: response.status,
    } as ApiError;
  }

  const data = await response.json();
  return data as Restaurant[];
}

export async function createRestaurant(name: string): Promise<Restaurant> {
  const response = await fetch(`${API_BASE_URL}/restaurants/add`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to create restaurant' }));
    throw {
      message: errorData.message || 'Failed to create restaurant',
      status: response.status,
    } as ApiError;
  }

  const data = await response.json();
  return data as Restaurant;
}

export async function removeRestaurant(id: string | number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/restaurants/delete?id=${id}`, {
    method: 'DELETE',
    headers: authHeaders('application/json'),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to delete restaurant' }));
    throw {
      message: errorData.message || 'Failed to delete restaurant',
      status: response.status,
    } as ApiError;
  }

  return;
}
