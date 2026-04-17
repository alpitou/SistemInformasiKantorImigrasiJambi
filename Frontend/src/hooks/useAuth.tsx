// src/hooks/useAuth.tsx
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User } from '../types';
import { authService, testConnection } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  testBackendConnection: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved === 'true';
  });

  useEffect(() => {
    const initAuth = async () => {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      
      console.log('Initializing auth - storedUser:', !!storedUser, 'token:', !!token);
      
      if (storedUser && token) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          console.log('User loaded from storage:', parsedUser);
        } catch (e) {
          console.error('Error parsing stored user:', e);
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        }
      }
      setIsLoading(false);
    };
    
    initAuth();
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', isDarkMode.toString());
  }, [isDarkMode]);

  const testBackendConnection = async () => {
    try {
      const result = await testConnection();
      console.log('Backend connection test result:', result);
      return true;
    } catch (error) {
      console.error('Backend connection failed:', error);
      return false;
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Login function called with:', { email, passwordLength: password.length });
      
      const response = await authService.login(email, password);
      console.log('Login service response:', response);
      
      if (response.success) {
        const userData = response.data.user;
        
        // Role dari backend: admin, ketua, bendahara, sekretaris, anggota
        if (userData.role) {
          if (typeof userData.role === 'object') {
            console.log('User role from backend:', userData.role.name);
            userData.roleName = userData.role.name;
          } else {
            userData.roleName = userData.role;
          }
        }
        
        setUser(userData);
        console.log('User set in context:', userData);
      } else {
        setError(response.message || 'Login gagal');
        throw new Error(response.message || 'Login gagal');
      }
    } catch (err: any) {
      console.error('Login error in hook:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Terjadi kesalahan saat login';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await authService.logout();
      setUser(null);
      console.log('Logout successful, user cleared');
    } catch (err: any) {
      console.error('Logout error:', err);
      setError(err.message || 'Gagal logout');
    } finally {
      setIsLoading(false);
    }
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
      isLoading,
      error,
      isDarkMode, 
      toggleDarkMode,
      testBackendConnection
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