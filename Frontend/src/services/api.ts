// src/services/api.ts
import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api';

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
    
    if (error.response?.status === 422) {
      console.error('Validation errors:', error.response?.data?.errors);
      console.error('Validation message:', error.response?.data?.message);
    }
    
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
  getUsers: async (page = 1, perPage = 15) => {
    const response = await api.get('/users', { params: { page, per_page: perPage } });
    return response;
  },

  getUser: async (id: number) => {
    const response = await api.get(`/users/${id}`);
    return response;
  },

  createUser: async (data: any) => {
    const cleanData = { ...data };
    
    if (!cleanData.password) {
      delete cleanData.password;
      delete cleanData.password_confirmation;
    }
    
    delete cleanData.id;
    delete cleanData.created_at;
    delete cleanData.updated_at;
    delete cleanData.deleted_at;
    delete cleanData.role;
    
    console.log('Create user - cleaned data:', cleanData);
    const response = await api.post('/users', cleanData);
    return response;
  },

  updateUser: async (id: number, data: any) => {
    const cleanData = { ...data };
    
    delete cleanData.id;
    delete cleanData.created_at;
    delete cleanData.updated_at;
    delete cleanData.deleted_at;
    delete cleanData.role;
    delete cleanData.password_confirmation;
    
    Object.keys(cleanData).forEach(key => {
      if (cleanData[key] === undefined) {
        delete cleanData[key];
      }
    });
    
    console.log('Update user - cleaned data:', cleanData);
    const response = await api.put(`/users/${id}`, cleanData);
    return response;
  },

  deleteUser: async (id: number) => {
    const response = await api.delete(`/users/${id}`);
    return response;
  },

  restoreUser: async (id: number) => {
    const response = await api.post(`/users/${id}/restore`);
    return response;
  }
};

export default api;