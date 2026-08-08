'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { adminLogout, adminProfile, type AdminProfile } from '@/services/auth';

interface AuthContextValue {
  admin: AdminProfile | null;
  isLoading: boolean;
  login: (admin: AdminProfile) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    adminProfile()
      .then(setAdmin)
      .catch(() => setAdmin(null))
      .finally(() => setIsLoading(false));
  }, []);

  const login = (profile: AdminProfile) => setAdmin(profile);

  const logout = async () => {
    await adminLogout();
    setAdmin(null);
    queryClient.clear();
  };

  return (
    <AuthContext.Provider value={{ admin, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
