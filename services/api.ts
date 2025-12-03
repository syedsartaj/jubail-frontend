
/**
 * API Service
 * 
 * This service mirrors the functionality of storage.ts (MockDB) but uses
 * standard fetch requests to communicate with the backend API routes (e.g., /api/bookings).
 * 
 * To switch the app to production:
 * 1. Ensure backend API routes are implemented in Next.js using `models/schema.ts`.
 * 2. Replace imports of `MockDB` with `ApiService` in your pages.
 */

import { User, Ticket, ActivitySlot, Booking, Staff, Activity, CartItem } from '../types';

const API_BASE = '/api';

export const ApiService = {
  // --- USERS ---
  async login(email: string, password: string): Promise<User | null> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) return null;
    return res.json();
  },

  async register(name: string, email: string, password: string): Promise<User | null> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({