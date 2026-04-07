import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User } from '../types';
import { DUMMY_USER, DUMMY_ADMIN } from '../constants';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (role: 'member' | 'admin') => void;
  logout: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const login = (role: 'member' | 'admin') => {
    setUser(role === 'member' ? DUMMY_USER : DUMMY_ADMIN);
  };

  const logout = () => {
    setUser(null);
  };

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      login, 
      logout, 
      isDarkMode, 
      toggleDarkMode 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
