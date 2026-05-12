// src/services/api.ts
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

// Gunakan relative path (akan diproxy oleh Vite ke http://127.0.0.1:8000/api)
const API_URL = '/api';

console.log('API_URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000,
});

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL + '/api',
});

apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

apiClient.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            // Panggil logout dari AuthContext tidak bisa langsung, pakai event
            window.dispatchEvent(new Event('auth:logout'));
        }
        return Promise.reject(error);
    }
);

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers.Accept = 'application/json';
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
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

// ==================== DATABASE BACKUP SERVICE ====================
export const databaseBackupService = {
  /**
   * Create a new database backup
   * @param type - Type of backup: 'full', 'sql', or 'structure'
   * @returns Promise with blob response for download
   */
  createBackup: async (type: 'full' | 'sql' | 'structure' = 'full') => {
    const response = await api.get('/database/backup', {
      params: { type },
      responseType: 'blob'
    });
    return response;
  },

  /**
   * Get list of all backup files
   * @returns Promise with list of backups
   */
  listBackups: async () => {
    const response = await api.get('/database/backups/list');
    return response;
  },

  /**
   * Download a specific backup file
   * @param filename - Name of the backup file
   * @returns Promise with blob response for download
   */
  downloadBackup: async (filename: string) => {
    const response = await api.get(`/database/backup/download/${encodeURIComponent(filename)}`, {
      responseType: 'blob'
    });
    return response;
  },

  /**
   * Delete a specific backup file
   * @param filename - Name of the backup file to delete
   * @returns Promise with delete response
   */
  deleteBackup: async (filename: string) => {
    const response = await api.delete(`/database/backup/delete/${encodeURIComponent(filename)}`);
    return response;
  },

  /**
   * Clean old backups (older than specified days)
   * @param days - Number of days to keep (default: 30)
   * @returns Promise with clean response
   */
  cleanBackups: async (days: number = 30) => {
    const response = await api.delete('/database/backup/clean', {
      params: { days }
    });
    return response;
  },

  /**
   * Get backup statistics
   * @returns Promise with stats
   */
  getBackupStats: async () => {
    const response = await api.get('/database/backups/stats');
    return response;
  }
};

// ==================== SAVINGS SERVICE (Tambahan untuk Payroll) ====================
export const savingsService = {
  /**
   * Get members for payroll deduction
   * @param month - Month in YYYY-MM format
   */
  getPayrollMembers: async (month: string) => {
    const response = await api.get('/savings/payroll/members', {
      params: { month }
    });
    return response;
  },

  /**
   * Process payroll deductions
   * @param data - Payroll processing data
   */
  processPayroll: async (data: { month: string; deductions: any[]; process_loan_installments: boolean }) => {
    const response = await api.post('/savings/payroll/process', data);
    return response;
  },

  /**
   * Get payroll history
   */
  getPayrollHistory: async () => {
    const response = await api.get('/savings/payroll/history');
    return response;
  },

  /**
   * Export payroll data
   * @param month - Month in YYYY-MM format
   */
  exportPayroll: async (month: string) => {
    const response = await api.get('/savings/payroll/export', {
      params: { month },
      responseType: 'blob'
    });
    return response;
  },

  /**
   * Get financial summary
   */
  getFinancialSummary: async () => {
    const response = await api.get('/savings/financial/summary');
    return response;
  },

  /**
   * Get transaction history
   * @param params - Filter parameters
   */
  getTransactionHistory: async (params?: { type?: string; month?: string }) => {
    const response = await api.get('/savings/financial/transactions', { params });
    return response;
  },

  /**
   * Get Kantin incomes
   * @param month - Month in YYYY-MM format
   */
  getKantinIncomes: async (month?: string) => {
    const response = await api.get('/savings/kantin/incomes', { params: { month } });
    return response;
  },

  /**
   * Add Kantin income
   * @param data - Kantin income data
   */
  addKantinIncome: async (data: any) => {
    const response = await api.post('/savings/kantin/incomes', data);
    return response;
  },

  /**
   * Update Kantin income
   * @param id - Kantin income ID
   * @param data - Updated data
   */
  updateKantinIncome: async (id: number, data: any) => {
    const response = await api.put(`/savings/kantin/incomes/${id}`, data);
    return response;
  },

  /**
   * Delete Kantin income
   * @param id - Kantin income ID
   */
  deleteKantinIncome: async (id: number) => {
    const response = await api.delete(`/savings/kantin/incomes/${id}`);
    return response;
  },

  /**
   * Calculate SHU
   * @param year - Year to calculate
   */
  calculateSHU: async (year?: number) => {
    const response = await api.get('/savings/financial/shu/calculate', { params: { year } });
    return response;
  },

  /**
   * Process SHU distribution
   * @param data - SHU distribution data
   */
  processSHU: async (data: any) => {
    const response = await api.post('/savings/financial/shu/process', data);
    return response;
  },

  /**
   * Get SHU history
   */
  getSHUHistory: async () => {
    const response = await api.get('/savings/financial/shu/history');
    return response;
  }
};

// ==================== LOAN SERVICE ====================
export const loanService = {
  /**
   * Get all loans
   * @param params - Filter parameters
   */
  getLoans: async (params?: { status?: string; user_id?: number; page?: number }) => {
    const response = await api.get('/loans', { params });
    return response;
  },

  /**
   * Get a specific loan
   * @param id - Loan ID
   */
  getLoan: async (id: number) => {
    const response = await api.get(`/loans/${id}`);
    return response;
  },

  /**
   * Create a new loan application
   * @param data - Loan data
   */
  createLoan: async (data: any) => {
    const response = await api.post('/loans', data);
    return response;
  },

  /**
   * Approve a loan
   * @param id - Loan ID
   * @param data - Approval data (notes, etc.)
   */
  approveLoan: async (id: number, data?: { notes?: string }) => {
    const response = await api.post(`/loans/${id}/approve`, data);
    return response;
  },

  /**
   * Reject a loan
   * @param id - Loan ID
   * @param data - Rejection data (reason)
   */
  rejectLoan: async (id: number, data: { reason: string }) => {
    const response = await api.post(`/loans/${id}/reject`, data);
    return response;
  },

  /**
   * Get loan installments
   * @param loanId - Loan ID
   */
  getInstallments: async (loanId: number) => {
    const response = await api.get(`/loans/${loanId}/installments`);
    return response;
  },

  /**
   * Pay loan installment
   * @param loanId - Loan ID
   * @param data - Payment data
   */
  payInstallment: async (loanId: number, data: { amount: number; payment_method: string; proof_image?: string }) => {
    const response = await api.post(`/loans/${loanId}/pay`, data);
    return response;
  }
};

// ==================== MEMBER SERVICE ====================
export const memberService = {
  /**
   * Get all members
   * @param params - Filter parameters
   */
  getMembers: async (params?: { search?: string; status?: string; page?: number }) => {
    const response = await api.get('/members', { params });
    return response;
  },

  /**
   * Get a specific member
   * @param id - Member ID
   */
  getMember: async (id: number) => {
    const response = await api.get(`/members/${id}`);
    return response;
  },

  /**
   * Update member data
   * @param id - Member ID
   * @param data - Updated data
   */
  updateMember: async (id: number, data: any) => {
    const response = await api.put(`/members/${id}`, data);
    return response;
  },

  /**
   * Activate a member
   * @param id - Member ID
   */
  activateMember: async (id: number) => {
    const response = await api.post(`/members/${id}/activate`);
    return response;
  },

  /**
   * Deactivate a member
   * @param id - Member ID
   */
  deactivateMember: async (id: number) => {
    const response = await api.post(`/members/${id}/deactivate`);
    return response;
  },

  /**
   * Get member savings summary
   * @param id - Member ID
   */
  getMemberSavings: async (id: number) => {
    const response = await api.get(`/members/${id}/savings`);
    return response;
  },

  /**
   * Get member loan summary
   * @param id - Member ID
   */
  getMemberLoans: async (id: number) => {
    const response = await api.get(`/members/${id}/loans`);
    return response;
  }
};

// ==================== UTILITY FUNCTIONS ====================
export const downloadFile = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatDate = (dateString: string, format: 'short' | 'long' | 'iso' = 'long'): string => {
  const date = new Date(dateString);
  
  if (format === 'short') {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric'
    }).format(date);
  }
  
  if (format === 'iso') {
    return date.toISOString().split('T')[0];
  }
  
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

// Default export tetap api untuk backward compatibility
export default apiClient;