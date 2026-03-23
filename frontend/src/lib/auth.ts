const TOKEN_KEY = 'prepsheet_token';
const USER_KEY = 'prepsheet_user';

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'manager' | 'employee';
}

function dispatchAuthChange(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('auth-changed'));
  }
}

export function setAuthSession(token: string, user: User): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  dispatchAuthChange();
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): User | null {
  const userJson = localStorage.getItem(USER_KEY);
  if (!userJson) return null;
  try {
    return JSON.parse(userJson);
  } catch {
    return null;
  }
}

export function isLoggedIn(): boolean {
  return getToken() !== null && getStoredUser() !== null;
}

export function clearAuthSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  // Remove legacy/local cache keys so role-specific state cannot leak after logout.
  localStorage.removeItem('prepsheet_restaurants');
  localStorage.removeItem('prepsheet_selected_restaurant');
  dispatchAuthChange();
}
