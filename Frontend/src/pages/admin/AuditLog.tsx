import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Activity, Search, Filter, Download, User, Clock, Shield, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';

interface ActivityLog {
  id: number;
  user_id: number;
  action: string;
  description: string;
  properties: any;
  created_at: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

interface PaginatedResponse {
  current_page: number;
  data: ActivityLog[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: any[];
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}

const AuditLog: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [pagination, setPagination] = useState<PaginatedResponse | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    user_id: '',
    action: '',
    start_date: '',
    end_date: ''
  });
  const [actions, setActions] = useState<string[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  const token = localStorage.getItem('token');

  const axiosConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  };

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const params: any = {
        page: currentPage,
        per_page: 15,
      };

      if (searchTerm) {
        params.search = searchTerm;
      }

      if (filters.user_id) params.user_id = filters.user_id;
      if (filters.action) params.action = filters.action;
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;

      const response = await axios.get(`${API_URL}/activity-logs`, {
        ...axiosConfig,
        params,
      });

      if (response.data.success) {
        setLogs(response.data.data.data);
        setPagination(response.data.data);
      }
    } catch (error: any) {
      console.error('Error fetching logs:', error);
      if (error.response?.status === 403) {
        alert('Anda tidak memiliki akses ke halaman ini');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchActions = async () => {
    try {
      const response = await axios.get(`${API_URL}/activity-logs/actions`, axiosConfig);
      if (response.data.success) {
        setActions(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching actions:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/users`, axiosConfig);
      if (response.data.success) {
        setUsers(response.data.data.data || response.data.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [currentPage, filters]);

  useEffect(() => {
    fetchActions();
    fetchUsers();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        fetchLogs();
      } else {
        setCurrentPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleExport = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_URL}/activity-logs/export`, {
        ...axiosConfig,
        params: {
          user_id: filters.user_id,
          action: filters.action,
          start_date: filters.start_date,
          end_date: filters.end_date,
        },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `activity-logs-${new Date().toISOString()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting logs:', error);
      alert('Gagal mengekspor data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchLogs();
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= (pagination?.last_page || 1)) {
      setCurrentPage(page);
    }
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes('LOGIN') || action.includes('LOGOUT')) return 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400';
    if (action.includes('CREATE_USER')) return 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400';
    if (action.includes('UPDATE_USER')) return 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400';
    if (action.includes('DELETE_USER')) return 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400';
    if (action.includes('LOAN')) return 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400';
    if (action.includes('SAVING')) return 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400';
    if (action.includes('UPLOAD')) return 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400';
    return 'bg-gray-50 dark:bg-neutral-700 text-gray-600 dark:text-gray-400';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Audit Log</h1>
          <p className="text-gray-500 dark:text-gray-400">Pantau seluruh aktivitas administratif dan perubahan sistem.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleRefresh}
            className="p-3 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-500 hover:text-imigrasi-primary transition-colors"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-6 py-2 bg-imigrasi-primary text-white rounded-xl text-sm font-bold hover:bg-blue-900 transition-colors shadow-lg shadow-imigrasi-primary/20"
          >
            <Download size={18} />
            Export Log
          </button>
        </div>
      </div>

      <div className="glass-card p-4 rounded-3xl space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari berdasarkan user, aksi, atau target..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-2xl outline-none transition-all dark:text-white"
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-50 dark:bg-neutral-700 rounded-2xl text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-600 transition-colors"
          >
            <Filter size={18} />
            Filter {showFilters ? '▲' : '▼'}
          </button>
        </div>

        {showFilters && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-neutral-700"
          >
            <select
              value={filters.user_id}
              onChange={(e) => setFilters({ ...filters, user_id: e.target.value })}
              className="px-4 py-2 bg-gray-50 dark:bg-neutral-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-imigrasi-primary dark:text-white"
            >
              <option value="">Semua User</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>

            <select
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value })}
              className="px-4 py-2 bg-gray-50 dark:bg-neutral-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-imigrasi-primary dark:text-white"
            >
              <option value="">Semua Aksi</option>
              {actions.map((action) => (
                <option key={action} value={action}>{action}</option>
              ))}
            </select>

            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
              placeholder="Dari tanggal"
              className="px-4 py-2 bg-gray-50 dark:bg-neutral-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-imigrasi-primary dark:text-white"
            />

            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
              placeholder="Sampai tanggal"
              className="px-4 py-2 bg-gray-50 dark:bg-neutral-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-imigrasi-primary dark:text-white"
            />
          </motion.div>
        )}
      </div>

      <div className="glass-card rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-neutral-800/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-bold">Waktu</th>
                <th className="px-6 py-4 font-bold">User</th>
                <th className="px-6 py-4 font-bold">Aksi</th>
                <th className="px-6 py-4 font-bold">Deskripsi</th>
                <th className="px-6 py-4 font-bold">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-700">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <RefreshCw size={32} className="animate-spin text-imigrasi-primary" />
                    </div>
                    <p className="mt-2 text-gray-500">Memuat data...</p>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    Tidak ada data log ditemukan
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-neutral-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock size={14} />
                        {formatDate(log.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-imigrasi-primary/10 rounded-full flex items-center justify-center text-imigrasi-primary">
                          <User size={14} />
                        </div>
                        <div>
                          <span className="text-sm font-bold text-gray-900 dark:text-white block">{log.user?.name || 'System'}</span>
                          <span className="text-xs text-gray-400">{log.user?.email || 'System'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getActionBadgeColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600 dark:text-gray-300">{log.description}</p>
                    </td>
                    <td className="px-6 py-4">
                      {log.properties && Object.keys(log.properties).length > 0 && (
                        <button
                          onClick={() => {
                            const details = Object.entries(log.properties)
                              .map(([key, val]) => `${key}: ${JSON.stringify(val)}`)
                              .join('\n');
                            alert(`Detail Log:\n${details}`);
                          }}
                          className="text-xs text-imigrasi-primary hover:underline"
                        >
                          Lihat Detail
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination && pagination.last_page > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-neutral-700">
            <div className="text-sm text-gray-500">
              Menampilkan {pagination.from} - {pagination.to} dari {pagination.total} data
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 dark:border-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
                  let pageNum;
                  if (pagination.last_page <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= pagination.last_page - 2) {
                    pageNum = pagination.last_page - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === pageNum
                          ? 'bg-imigrasi-primary text-white'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === pagination.last_page}
                className="p-2 rounded-lg border border-gray-300 dark:border-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AuditLog;