import axios from 'axios';
import { User } from '../types';

const API_URL = 'http://127.0.0.1:8000/api'; // Gunakan 127.0.0.1, bukan localhost

console.log('API_URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, config.data);
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    console.error('[API Response Error]', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Test connection
export const testConnection = async () => {
  try {
    const response = await api.get('/test');
    console.log('Connection test:', response.data);
    return response.data;
  } catch (error) {
    console.error('Connection test failed:', error);
    throw error;
  }
};

// Auth Service
export const authService = {
  login: async (email: string, password: string) => {
    console.log('Attempting login with:', { email, passwordLength: password.length });
    
    try {
      const response = await api.post('/login', { email, password });
      console.log('Login response:', response.data);
      
      if (response.data.success) {
        const { access_token, user } = response.data.data;
        localStorage.setItem('token', access_token);
        localStorage.setItem('user', JSON.stringify(user));
        console.log('Token stored, user stored');
      }
      return response.data;
    } catch (error: any) {
      console.error('Login API error:', error);
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
      }
      throw error;
    }
  },
  
  logout: async () => {
    try {
      const response = await api.post('/logout');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return response.data;
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },
  
  getCurrentUser: async () => {
    const response = await api.get('/me');
    return response.data;
  },
};

// User Service
export const userService = {
  getUsers: async () => {
    const response = await api.get('/users');
    return response;
  },

  createUser: async (data: any) => {
    const response = await api.post('/users', data);
    return response;
  },

  updateUser: async (id: number, data: any) => {
    const response = await api.put(`/users/${id}`, data);
    return response;
  },

  deleteUser: async (id: number) => {
    const response = await api.delete(`/users/${id}`);
    return response;
  }
};

export default api;