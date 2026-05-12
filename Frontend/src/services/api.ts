// src/services/api.ts
import axios from 'axios';

// Gunakan relative path (akan diproxy oleh Vite ke backend)
const API_URL = '/api';

console.log('API_URL:', API_URL);

// Buat satu instance axios saja
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
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
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
    console.log(`[API Response] ${response.config.url}`, response.status);
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
      window.dispatchEvent(new Event('auth:logout'));
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

// ==================== AUTH SERVICE ====================
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

// ==================== USER SERVICE ====================
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

// ==================== LOAN SERVICE ====================
export const loanService = {
  getLoans: async (params?: { archive?: boolean; page?: number }) => {
    const response = await api.get('/loans', { params });
    return response;
  },

  getLoan: async (id: number) => {
    const response = await api.get(`/loans/${id}`);
    return response;
  },

  getLoanHistory: async () => {
    const response = await api.get('/loans/history');
    return response;
  },

  createLoan: async (data: any) => {
    const response = await api.post('/loans', data);
    return response;
  },

  submitWithDocument: async (formData: FormData) => {
    const response = await api.post('/loans/submit-with-document', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response;
  },

  generateDraftAgreement: async (data: any) => {
    const response = await api.post('/loans/generate-draft', data, {
      responseType: 'blob'
    });
    return response;
  },

  generateAgreement: async (id: number) => {
    const response = await api.get(`/loans/${id}/generate-agreement`, {
      responseType: 'blob'
    });
    return response;
  },

  uploadDocument: async (id: number, file: File) => {
    const formData = new FormData();
    formData.append('document', file);
    const response = await api.post(`/loans/${id}/upload-document`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response;
  },

  downloadDocument: async (id: number) => {
    const response = await api.get(`/loans/${id}/download-document`, {
      responseType: 'blob'
    });
    return response;
  },

  getDocumentInfo: async (id: number) => {
    const response = await api.get(`/loans/${id}/document-info`);
    return response;
  },

  getInstallments: async (id: number) => {
    const response = await api.get(`/loans/${id}/installments`);
    return response;
  },

  treasurerApprove: async (id: number, notes?: string) => {
    const response = await api.put(`/loans/${id}/treasurer-approve`, { notes });
    return response;
  },

  chairmanApprove: async (id: number, notes?: string) => {
    const response = await api.put(`/loans/${id}/chairman-approve`, { notes });
    return response;
  },

  disburse: async (id: number, notes?: string) => {
    const response = await api.put(`/loans/${id}/disburse`, { notes });
    return response;
  },

  rejectLoan: async (id: number, notes?: string) => {
    const response = await api.put(`/loans/${id}/reject`, { notes });
    return response;
  },

  uploadChairmanSigned: async (id: number, file: File) => {
    const formData = new FormData();
    formData.append('document', file);
    const response = await api.post(`/loans/${id}/upload-chairman-signed`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response;
  },

  downloadChairmanSigned: async (id: number) => {
    const response = await api.get(`/loans/${id}/download-chairman-signed`, {
      responseType: 'blob'
    });
    return response;
  },

  getLoanSettings: async () => {
    const response = await api.get('/loan-settings');
    return response;
  }
};

// ==================== LOAN INSTALLMENT SERVICE ====================
export const installmentService = {
  getInstallments: async (loanId: number) => {
    const response = await api.get(`/installments/loan/${loanId}`);
    return response;
  },

  storeInstallment: async (data: any) => {
    const response = await api.post('/installments', data);
    return response;
  },

  payFull: async (data: { loan_id: number; payment_date: string; payment_method: string; notes?: string }) => {
    const response = await api.post('/installments/pay-full', data);
    return response;
  }
};

// ==================== SAVINGS SERVICE ====================
export const savingsService = {
  getSavings: async (params?: { status?: string; page?: number }) => {
    const response = await api.get('/savings', { params });
    return response;
  },

  getPayrollMembers: async (month: string) => {
    const response = await api.get('/savings/payroll/members', { params: { month } });
    return response;
  },

  processPayroll: async (data: { month: string; deductions: any[]; process_loan_installments: boolean }) => {
    const response = await api.post('/savings/payroll/process', data);
    return response;
  },

  getPayrollHistory: async () => {
    const response = await api.get('/savings/payroll/history');
    return response;
  },

  exportPayroll: async (month: string) => {
    const response = await api.get('/savings/payroll/export', {
      params: { month },
      responseType: 'blob'
    });
    return response;
  },

  getFinancialSummary: async () => {
    const response = await api.get('/savings/financial/summary');
    return response;
  },

  getTransactionHistory: async (params?: { type?: string; month?: string }) => {
    const response = await api.get('/savings/financial/transactions', { params });
    return response;
  },

  getKantinIncomes: async (params?: { month?: string }) => {
    const response = await api.get('/savings/kantin/incomes', { params });
    return response;
  },

  addKantinIncome: async (data: any) => {
    const response = await api.post('/savings/kantin/incomes', data);
    return response;
  },

  updateKantinIncome: async (id: number, data: any) => {
    const response = await api.put(`/savings/kantin/incomes/${id}`, data);
    return response;
  },

  deleteKantinIncome: async (id: number) => {
    const response = await api.delete(`/savings/kantin/incomes/${id}`);
    return response;
  },

  calculateSHU: async (params?: { year?: number }) => {
    const response = await api.get('/savings/financial/shu/calculate', { params });
    return response;
  },

  processSHU: async (data: any) => {
    const response = await api.post('/savings/financial/shu/process', data);
    return response;
  },

  getSHUHistory: async () => {
    const response = await api.get('/savings/financial/shu/history');
    return response;
  },

  verifyDeposit: async (id: number) => {
    const response = await api.put(`/savings/${id}/verify`);
    return response;
  }
};

// ==================== WITHDRAWAL SERVICE ====================
export const withdrawalService = {
  getWithdrawals: async (params?: { status?: string; page?: number }) => {
    const response = await api.get('/withdrawals', { params });
    return response;
  },

  getWithdrawalStats: async () => {
    const response = await api.get('/withdrawals/stats');
    return response;
  },

  createWithdrawal: async (data: any) => {
    const response = await api.post('/withdrawals', data);
    return response;
  },

  getWithdrawal: async (id: number) => {
    const response = await api.get(`/withdrawals/${id}`);
    return response;
  },

  treasurerApprove: async (id: number) => {
    const response = await api.post(`/withdrawals/${id}/treasurer-approve`);
    return response;
  },

  chairmanApprove: async (id: number) => {
    const response = await api.post(`/withdrawals/${id}/chairman-approve`);
    return response;
  },

  rejectWithdrawal: async (id: number) => {
    const response = await api.post(`/withdrawals/${id}/reject`);
    return response;
  },

  disburseWithdrawal: async (id: number) => {
    const response = await api.post(`/withdrawals/${id}/disburse`);
    return response;
  }
};

// ==================== DATABASE BACKUP SERVICE ====================
export const databaseBackupService = {
  createBackup: async (type: 'full' | 'sql' | 'structure' = 'full') => {
    const response = await api.get('/database/backup', {
      params: { type },
      responseType: 'blob'
    });
    return response;
  },

  listBackups: async () => {
    const response = await api.get('/database/backups/list');
    return response;
  },

  downloadBackup: async (filename: string) => {
    const response = await api.get(`/database/backup/download/${encodeURIComponent(filename)}`, {
      responseType: 'blob'
    });
    return response;
  },

  deleteBackup: async (filename: string) => {
    const response = await api.delete(`/database/backup/delete/${encodeURIComponent(filename)}`);
    return response;
  },

  cleanBackups: async (days: number = 30) => {
    const response = await api.delete('/database/backup/clean', {
      params: { days }
    });
    return response;
  }
};

// ==================== MEMBER SERVICE ====================
export const memberService = {
  getMemberDashboard: async () => {
    const response = await api.get('/member/dashboard/stats');
    return response;
  },

  getMemberTransactions: async () => {
    const response = await api.get('/member/dashboard/transactions');
    return response;
  },

  getMemberProfile: async () => {
    const response = await api.get('/member/profile');
    return response;
  },

  getMemberLoans: async () => {
    const response = await api.get('/member/loan-history');
    return response;
  },

  getMemberSavings: async () => {
    const response = await api.get('/member/saving-history');
    return response;
  }
};

// ==================== DASHBOARD SERVICE ====================
export const dashboardService = {
  getStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response;
  },

  getChartData: async () => {
    const response = await api.get('/dashboard/chart');
    return response;
  },

  getSavingComposition: async () => {
    const response = await api.get('/dashboard/saving-composition');
    return response;
  },

  getRecentActivities: async () => {
    const response = await api.get('/dashboard/recent-activities');
    return response;
  },

  getQuickLinks: async () => {
    const response = await api.get('/dashboard/quick-links');
    return response;
  }
};

// ==================== REPORT SERVICE ====================
export const reportService = {
  generateRekeningKoran: async (userId: number, params?: { start_date?: string; end_date?: string }) => {
    const response = await api.get(`/report/rekening-koran/${userId}`, { params });
    return response;
  },

  loanSummary: async (params?: { status?: string; month?: string }) => {
    const response = await api.get('/report/loan-summary', { params });
    return response;
  },

  savingSummary: async (params?: { month?: string }) => {
    const response = await api.get('/report/saving-summary', { params });
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
  if (amount === undefined || amount === null || isNaN(amount)) {
    return 'Rp 0';
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatDate = (dateString: string, format: 'short' | 'long' | 'iso' = 'long'): string => {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    
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
  } catch {
    return '-';
  }
};

// Default export
export default api;