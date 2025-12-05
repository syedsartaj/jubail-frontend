// src/services/auth.ts
import { User } from '../types';
import { ApiService } from './api';

const STORAGE_KEY = 'riverrun_auth';

export const AuthService = {
  /**
   * Login user with email & password
   * Stores JWT token and user info in localStorage
   */
  login: async (email: string, password: string): Promise<User | null> => {
    try {
      const res = await ApiService.login(email, password);
      console.log(res);
      if (res?.token && res?.user) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(res));
        return res.user;
      }
      return null;
    } catch (err) {
      console.error('Login failed', err);
      return null;
    }
  },

  /**
   * Register a new user
   * Stores JWT token and user info in localStorage
   */
  register: async (name: string, email: string, password: string): Promise<User | null> => {
    try {
      const res = await ApiService.register(name, email, password);
      if (res?.token && res?.user) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(res));
        return res.user;
      }
      return null;
    } catch (err) {
      console.error('Register failed', err);
      return null;
    }
  },

  /**
   * Logout current user
   * Clears localStorage
   */
  logout: () => {
    localStorage.removeItem(STORAGE_KEY);
  },

  /**
   * Get current logged-in user
   */
  getCurrentUser: (): User | null => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return parsed.user || null;
  },

  /**
   * Get JWT token for authenticated API calls
   */
  getToken: (): string | null => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return parsed.token || null;
  },

  /**
   * Check if user is logged in
   */
  isLoggedIn: (): boolean => {
    return !!AuthService.getToken();
  }
};
