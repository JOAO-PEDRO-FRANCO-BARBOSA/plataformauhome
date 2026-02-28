import React, { createContext, useContext, useState, useCallback } from 'react';
import { StudentProfile } from '@/types';
import { mockCurrentUser } from '@/data/mockData';

interface AuthContextType {
  isLoggedIn: boolean;
  user: StudentProfile | null;
  login: (email: string, password: string) => void;
  register: (name: string, email: string, password: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<StudentProfile | null>(null);

  const login = useCallback((_email: string, _password: string) => {
    setUser(mockCurrentUser);
    setIsLoggedIn(true);
  }, []);

  const register = useCallback((name: string, _email: string, _password: string) => {
    setUser({ ...mockCurrentUser, name });
    setIsLoggedIn(true);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setIsLoggedIn(false);
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
