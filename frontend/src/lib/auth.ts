import { config } from './config';

export interface User {
  user_id: string;
  google_id: string;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
  email_opt_in?: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export const API_BASE_URL = config.API_BASE_URL;

export const authApi = {
  async googleLogin(idToken: string) {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/google/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id_token: idToken }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    return response.json();
  },

  async getCurrentUser(token: string) {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get user info');
    }

    return response.json();
  },

  async logout() {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Logout failed');
    }

    return response.json();
  },
}; 

export const usersApi = {
  async getProfile(token: string) {
    const res = await fetch(`${API_BASE_URL}/api/v1/users/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to load profile');
    return res.json();
  },
  async updateProfile(
    token: string,
    data: Partial<Pick<User, 'name' | 'email_opt_in'>>,
  ) {
    const res = await fetch(`${API_BASE_URL}/api/v1/users/profile`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update profile');
    return res.json();
  },
};