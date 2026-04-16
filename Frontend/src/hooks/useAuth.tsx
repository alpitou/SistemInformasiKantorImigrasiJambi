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

  // Initialize auth from localStorage
  useEffect(() => {
    const initAuth = async () => {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      
      console.log('Initializing auth - storedUser:', !!storedUser, 'token:', !!token);
      
      if (storedUser && token) {
        try {
          const parsedUser = JSON.parse(storedUser);
          
          // Normalisasi role saat load dari storage
          if (parsedUser.role) {
            if (typeof parsedUser.role === 'object') {
              if (parsedUser.role.name === 'anggota') {
                parsedUser.role.name = 'member';
              }
              parsedUser.roleName = parsedUser.role.name;
            } else if (parsedUser.role === 'anggota') {
              parsedUser.role = 'member';
              parsedUser.roleName = 'member';
            }
          }
          
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

  // Apply dark mode class to html element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', isDarkMode.toString());
  }, [isDarkMode]);

  // Test backend connection
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

  // Login function
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Login function called with:', { email, passwordLength: password.length });
      
      const response = await authService.login(email, password);
      console.log('Login service response:', response);
      
      if (response.success) {
        const userData = response.data.user;
        
        // NORMALISASI ROLE: jika role === 'anggota', ubah menjadi 'member'
        if (userData.role) {
          if (typeof userData.role === 'object') {
            if (userData.role.name === 'anggota') {
              userData.role.name = 'member';
              console.log('Role normalized: anggota -> member');
            }
            userData.roleName = userData.role.name;
          } else if (userData.role === 'anggota') {
            userData.role = 'member';
            userData.roleName = 'member';
            console.log('Role normalized: anggota -> member');
          } else {
            userData.roleName = userData.role;
          }
        }
        
        // Pastikan user memiliki role yang valid
        const finalRole = userData.role?.name || userData.role || 'member';
        console.log('Final user role:', finalRole);
        
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

  // Logout function
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

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    isLoading,
    error,
    isDarkMode,
    toggleDarkMode,
    testBackendConnection
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};