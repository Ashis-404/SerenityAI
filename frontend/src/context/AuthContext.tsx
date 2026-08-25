import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, UserPreference } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updatePreferences: (data: Partial<UserPreference>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const userData = await api.getMe();
      setUser(userData);
    } catch (err) {
      localStorage.removeItem('serenity_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('serenity_token');
    if (token) {
      refreshUser();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (data: any) => {
    const res = await api.login(data);
    localStorage.setItem('serenity_token', res.access_token);
    setUser(res.user);
  };

  const register = async (data: any) => {
    const res = await api.register(data);
    localStorage.setItem('serenity_token', res.access_token);
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem('serenity_token');
    setUser(null);
  };

  const updatePreferences = async (data: Partial<UserPreference>) => {
    const updated = await api.updatePreferences(data);
    if (user) {
      setUser({ ...user, preferences: updated });
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, updatePreferences }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
