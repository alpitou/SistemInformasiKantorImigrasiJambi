import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User } from '../types';
import { DUMMY_USER, DUMMY_ADMIN, DUMMY_SECRETARY, DUMMY_TREASURER, DUMMY_CHAIRMAN } from '../constants';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (role: 'member' | 'admin' | 'secretary' | 'treasurer' | 'chairman') => void;
  logout: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved === 'true';
  });

  React.useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', isDarkMode.toString());
  }, [isDarkMode]);

  const login = (role: 'member' | 'admin' | 'secretary' | 'treasurer' | 'chairman') => {
    if (role === 'member') setUser(DUMMY_USER);
    else if (role === 'admin') setUser(DUMMY_ADMIN);
    else if (role === 'secretary') setUser(DUMMY_SECRETARY);
    else if (role === 'treasurer') setUser(DUMMY_TREASURER);
    else if (role === 'chairman') setUser(DUMMY_CHAIRMAN);
  };

  const logout = () => {
    setUser(null);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
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
