import type { User } from './auth';
import type { Restaurant } from './types';

export type { Restaurant };

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
    const errorData = await response.json().catch(() => ({ error: 'Failed to create restaurant' }));
    throw {
      message: errorData.message || errorData.error || 'Failed to create restaurant',
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
    const errorData = await response.json().catch(() => ({ error: 'Failed to delete restaurant' }));
    throw {
      message: errorData.message || errorData.error || 'Failed to delete restaurant',
      status: response.status,
    } as ApiError;
  }

  return;
}

export async function updateRestaurant(id: number, name: string): Promise<Restaurant> {
  const response = await fetch(`${API_BASE_URL}/restaurants/update`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ id, name }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to update restaurant' }));
    throw {
      message: errorData.message || errorData.error || 'Failed to update restaurant',
      status: response.status,
    } as ApiError;
  }

  const data = await response.json();
  return data as Restaurant;
}

// ============================================================================
// EMPLOYEE MANAGEMENT
// ============================================================================

export interface Employee {
  id: number;
  name: string;
  email: string;
  status: 'active' | 'inactive';
  restaurants: Restaurant[];
  created_at: string;
}

export interface CreateEmployeeRequest {
  name: string;
  email: string;
  password: string;
  status: 'active' | 'inactive';
  restaurants: number[];
}

export interface UpdateEmployeeRequest {
  user_id: number;
  name: string;
  email: string;
  password?: string;
}

export async function getEmployees(): Promise<Employee[]> {
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: 'GET',
    headers: authHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to fetch employees' }));
    throw {
      message: errorData.message || 'Failed to fetch employees',
      status: response.status,
    } as ApiError;
  }

  const data = await response.json();
  return data as Employee[];
}

export async function createEmployee(req: CreateEmployeeRequest): Promise<{ id: number; message: string }> {
  const response = await fetch(`${API_BASE_URL}/users/create`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(req),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to create employee' }));
    throw {
      message: errorData.message || errorData.error || 'Failed to create employee',
      status: response.status,
    } as ApiError;
  }

  const data = await response.json();
  return data as { id: number; message: string };
}

export async function updateEmployeeStatus(userId: number, status: 'active' | 'inactive'): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/users/status`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ user_id: userId, status }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to update employee status' }));
    throw {
      message: errorData.message || errorData.error || 'Failed to update employee status',
      status: response.status,
    } as ApiError;
  }

  const data = await response.json();
  return data as { message: string };
}

export async function updateEmployee(req: UpdateEmployeeRequest): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/users/update`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(req),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to update employee' }));
    throw {
      message: errorData.message || errorData.error || 'Failed to update employee',
      status: response.status,
    } as ApiError;
  }

  const data = await response.json();
  return data as { message: string };
}

export async function verifyCurrentPassword(currentPassword: string): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/users/verify-password`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ current_password: currentPassword }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to verify password' }));
    throw {
      message: errorData.message || errorData.error || 'Failed to verify password',
      status: response.status,
    } as ApiError;
  }

  const data = await response.json();
  return data as { message: string };
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/users/change-password`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to change password' }));
    throw {
      message: errorData.message || errorData.error || 'Failed to change password',
      status: response.status,
    } as ApiError;
  }

  const data = await response.json();
  return data as { message: string };
}

export async function deleteEmployee(userId: number): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/users/delete?id=${userId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to delete employee' }));
    throw {
      message: errorData.message || errorData.error || 'Failed to delete employee',
      status: response.status,
    } as ApiError;
  }

  const data = await response.json();
  return data as { message: string };
}

// ============================================================================
// ASSIGNMENTS
// ============================================================================

export interface Assignment {
  id: number;
  restaurant_id: number;
  restaurant_name: string;
  employee_id: number;
  employee_name: string;
  employee_email: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export async function getAssignments(): Promise<Assignment[]> {
  const response = await fetch(`${API_BASE_URL}/assignments`, {
    method: 'GET',
    headers: authHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to fetch assignments' }));
    throw {
      message: errorData.message || 'Failed to fetch assignments',
      status: response.status,
    } as ApiError;
  }

  const data = await response.json();
  return data as Assignment[];
}

export async function addAssignment(restaurantId: number, employeeId: number): Promise<{ id: number; message: string }> {
  const response = await fetch(`${API_BASE_URL}/assignments/add`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      restaurant_id: restaurantId,
      employee_id: employeeId,
      status: 'active',
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to add assignment' }));
    throw {
      message: errorData.message || errorData.error || 'Failed to add assignment',
      status: response.status,
    } as ApiError;
  }

  const data = await response.json();
  return data as { id: number; message: string };
}

export async function deleteAssignment(assignmentId: number): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/assignments/delete?id=${assignmentId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to delete assignment' }));
    throw {
      message: errorData.message || errorData.error || 'Failed to delete assignment',
      status: response.status,
    } as ApiError;
  }

  const data = await response.json();
  return data as { message: string };
}

// ============================================================================
// SALES & REPORTS
// ============================================================================

export interface SaleExpenditureInput {
  title: string;
  amount: number;
}

export interface SalePayload {
  date: string;
  restaurant_id: number;
  restaurant: string;
  lunch_head_count: number;
  lunch_sale: number;
  dinner_head_count: number;
  dinner_sale: number;
  credit_sale: number;
  reji_money: number;
  expenditures: SaleExpenditureInput[];
  note: string;
}

export interface SaleRecord {
  id: number;
  employee_id: number;
  restaurant_id: number;
  restaurant_name: string;
  date: string;
  lunch_head_count: number;
  lunch_sale: number;
  dinner_head_count: number;
  dinner_sale: number;
  credit_sale: number;
  reji_money: number;
  expenditures: SaleExpenditureInput[];
  note: string;
  created_at: string;
}

export interface MonthlyReport {
  month: string;
  total_sales: number;
  total_lunch: number;
  total_dinner: number;
  entry_count: number;
}

export async function submitSale(payload: SalePayload): Promise<{ message: string; sale_id: number }> {
  const response = await fetch(`${API_BASE_URL}/sales`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to submit sale' }));
    throw {
      message: errorData.message || errorData.error || 'Failed to submit sale',
      status: response.status,
    } as ApiError;
  }

  const data = await response.json();
  return data as { message: string; sale_id: number };
}

export async function fetchSales(params?: { startDate?: string; endDate?: string; restaurantId?: number }): Promise<SaleRecord[]> {
  const query = new URLSearchParams();
  if (params?.startDate) query.set('start_date', params.startDate);
  if (params?.endDate) query.set('end_date', params.endDate);
  if (params?.restaurantId) query.set('restaurant_id', String(params.restaurantId));

  const response = await fetch(`${API_BASE_URL}/sales/all${query.toString() ? `?${query.toString()}` : ''}`, {
    method: 'GET',
    headers: authHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to fetch sales' }));
    throw {
      message: errorData.message || 'Failed to fetch sales',
      status: response.status,
    } as ApiError;
  }

  const data = await response.json();
  return data as SaleRecord[];
}

export async function fetchMonthlyReport(month?: string, restaurantId?: number): Promise<MonthlyReport> {
  const query = new URLSearchParams();
  if (month) query.set('month', month);
  if (restaurantId) query.set('restaurant_id', String(restaurantId));
  const queryString = query.toString();
  const response = await fetch(`${API_BASE_URL}/reports/monthly${queryString ? `?${queryString}` : ''}`, {
    method: 'GET',
    headers: authHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to fetch monthly report' }));
    throw {
      message: errorData.message || 'Failed to fetch monthly report',
      status: response.status,
    } as ApiError;
  }

  const data = await response.json();
  return data as MonthlyReport;
}
