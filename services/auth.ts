import { useState, useEffect, useContext, createContext } from 'react';
import { User, UserRole, AuthState } from '../types';
import { MockDB } from './storage';

export const AuthService = {
  login: async (email: string, password: string): Promise<User | null> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const user = MockDB.findUserByEmail(email);
    if (user && user.passwordHash === password) {
      const safeUser = { ...user, passwordHash: undefined };
      localStorage.setItem('riverrun_auth', JSON.stringify(safeUser));
      return safeUser;
    }
    return null;
  },

  register: async (name: string, email: string, password: string): Promise<User | null> => {
    await new Promise(resolve => setTimeout(resolve, 500));

    const existingUser = MockDB.findUserByEmail(email);
    if (existingUser) {
      return null; // Email already taken
    }

    const newUser: User = {
      id: `user_${Date.now()}`,
      name,
      email,
      passwordHash: password,
      role: UserRole.CUSTOMER
    };

    MockDB.saveUser(newUser);
    
    // Auto login after register
    const safeUser = { ...newUser, passwordHash: undefined };
    localStorage.setItem('riverrun_auth', JSON.stringify(safeUser));
    return safeUser;
  },
  
  logout: () => {
    localStorage.removeItem('riverrun_auth');
  },
  
  getCurrentUser: (): User | null => {
    const stored = localStorage.getItem('riverrun_auth');
    return stored ? JSON.parse(stored) : null;
  }
};