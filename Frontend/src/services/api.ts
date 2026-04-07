import axios from 'axios';
import { User, Savings, Loan, Transaction, SHU } from '../types';

const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add auth interceptor for Laravel Sanctum/JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const memberService = {
  getProfile: () => api.get<User>('/member/profile'),
  getSavings: () => api.get<Savings>('/member/savings'),
  getLoans: () => api.get<Loan[]>('/member/loans'),
  getTransactions: () => api.get<Transaction[]>('/member/transactions'),
  getSHU: () => api.get<SHU[]>('/member/shu'),
  applyLoan: (data: { amount: number; tenor: number; purpose: string }) => 
    api.post('/member/loans', data),
  withdrawSavings: (data: { amount: number; category: string }) => 
    api.post('/member/withdraw', data),
};

export const adminService = {
  getDashboardStats: () => api.get('/admin/dashboard-stats'),
  getMembers: () => api.get<User[]>('/admin/members'),
  createMember: (data: Partial<User>) => api.post('/admin/members', data),
  updateMember: (id: string, data: Partial<User>) => api.put(`/admin/members/${id}`, data),
  deleteMember: (id: string) => api.delete(`/admin/members/${id}`),
  getLoanRequests: () => api.get<Loan[]>('/admin/loans/requests'),
  approveLoan: (id: string) => api.post(`/admin/loans/${id}/approve`),
  rejectLoan: (id: string, reason: string) => api.post(`/admin/loans/${id}/reject`, { reason }),
  calculateSHU: (year: number) => api.post('/admin/shu/calculate', { year }),
  getReports: (type: string, startDate: string, endDate: string) => 
    api.get('/admin/reports', { params: { type, startDate, endDate } }),
};

export default api;
