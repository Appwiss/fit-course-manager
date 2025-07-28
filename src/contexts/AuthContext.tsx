import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types/fitness';
import { LocalStorageService } from '@/lib/localStorage';

interface AuthContextType {
  currentUser: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    // Initialiser les données lors du premier chargement
    LocalStorageService.initializeData();
    
    // Vérifier s'il y a un utilisateur connecté
    const user = LocalStorageService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  const login = (username: string, password: string): boolean => {
    const user = LocalStorageService.authenticate(username, password);
    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const logout = () => {
    LocalStorageService.logout();
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    login,
    logout,
    isAuthenticated: !!currentUser,
    isAdmin: currentUser?.isAdmin || false
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}