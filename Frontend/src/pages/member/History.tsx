// src/pages/member/History.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { 
  Search, Filter, Download, ArrowUpRight, ArrowDownRight, 
  RefreshCw, Calendar, Wallet, TrendingUp, HandCoins, History as HistoryIcon,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import api from '../../services/api';

interface Transaction {
  id: string;
  original_id: number;
  type: string;
  category: string;
  title: string;
  description: string;
  amount: number;
  date: string;
  user: string;
  status: string;
  is_income: boolean;
  transaction_type?: 'deposit' | 'withdrawal' | 'installment' | 'loan';
  verification_status?: string;
  payment_method?: string;
  installment_number?: number;
}

const HistoryPage: React.FC = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return now.toISOString().slice(0, 7);
  });

  const formatCurrency = (amount: number) => {
    if (isNaN(amount) || amount === null || amount === undefined) {
      return 'Rp 0';
    }
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = { 
        type: filterType,
        for_member: true
      };
      
      // Only add month filter if not 'all'
      if (selectedMonth && selectedMonth !== 'all') {
        params.month = selectedMonth;
      }
      
      const response = await api.get('/savings/financial/transactions', { params });
      
      console.log('API Response:', response.data);
      
      if (response.data.success) {
        const data = response.data.data;
        if (Array.isArray(data) && data.length > 0) {
          setTransactions(data);
          console.log('Transactions loaded:', data.length);
        } else {
          setTransactions([]);
          console.log('No transactions found');
        }
      } else {
        setTransactions([]);
      }
    } catch (error: any) {
      console.error('Failed to fetch history:', error);
      addNotification({
        title: 'Error',
        message: error.response?.data?.message || 'Gagal mengambil riwayat transaksi',
        type: 'error'
      });
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  }, [filterType, selectedMonth, addNotification]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = (t.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
      (t.category?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (t.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || t.type === filterType;

    return matchesSearch && matchesType;
  });

  const getTransactionIcon = (type: string, transactionType?: string) => {
    if (transactionType === 'withdrawal') {
      return <ArrowDownRight size={16} className="text-red-600" />;
    }
    
    switch(type) {
      case 'saving':
        return <ArrowUpRight size={16} className="text-green-600" />;
      case 'payroll':
        return <TrendingUp size={16} className="text-blue-600" />;
      case 'loan_installment':
        return <HandCoins size={16} className="text-amber-600" />;
      case 'loan':
        return <HandCoins size={16} className="text-purple-600" />;
      case 'withdrawal':
        return <ArrowDownRight size={16} className="text-red-600" />;
      default:
        return <Wallet size={16} className="text-gray-600" />;
    }
  };

  const getTransactionColor = (type: string, transactionType?: string) => {
    if (transactionType === 'withdrawal') {
      return 'bg-red-100';
    }
    
    switch(type) {
      case 'saving':
        return 'bg-green-100';
      case 'payroll':
        return 'bg-blue-100';
      case 'loan_installment':
        return 'bg-amber-100';
      case 'loan':
        return 'bg-purple-100';
      default:
        return 'bg-gray-100';
    }
  };

  const getAmountColor = (transaction: Transaction) => {
    if (transaction.transaction_type === 'withdrawal') {
      return 'text-red-600 dark:text-red-400';
    }
    if (transaction.type === 'loan_installment') {
      return 'text-amber-600 dark:text-amber-400';
    }
    if (transaction.type === 'loan') {
      return 'text-purple-600 dark:text-purple-400';
    }
    return 'text-emerald-600 dark:text-emerald-400';
  };

  const getAmountPrefix = (transaction: Transaction) => {
    if (transaction.transaction_type === 'withdrawal') {
      return '-';
    }
    if (transaction.type === 'loan_installment') {
      return '-';
    }
    if (transaction.type === 'loan') {
      return '';
    }
    return '+';
  };

  const getStatusBadge = (transaction: Transaction) => {
    // For loan applications
    if (transaction.type === 'loan') {
      switch(transaction.status) {
        case 'pending':
          return <span className="px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">Menunggu Verifikasi</span>;
        case 'approved':
          return <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">Disetujui</span>;
        case 'active':
          return <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">Aktif</span>;
        case 'rejected':
          return <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">Ditolak</span>;
        case 'completed':
          return <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">Lunas</span>;
        default:
          return <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">{transaction.status}</span>;
      }
    }
    
    // For withdrawal transactions
    if (transaction.transaction_type === 'withdrawal') {
      if (transaction.verification_status === 'pending') {
        return (
          <span className="px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
            Menunggu Verifikasi
          </span>
        );
      }
      return (
        <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
          Diproses
        </span>
      );
    }
    
    // For loan installments
    if (transaction.type === 'loan_installment') {
      return (
        <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
          Lunas
        </span>
      );
    }
    
    // For pending deposits
    if (transaction.verification_status === 'pending') {
      return (
        <span className="px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
          Menunggu Verifikasi
        </span>
      );
    }
    
    // Default success
    return (
      <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
        Berhasil
      </span>
    );
  };

  const handleExport = async () => {
    if (filteredTransactions.length === 0) {
      addNotification({
        title: 'Info',
        message: 'Tidak ada data transaksi untuk diekspor',
        type: 'info'
      });
      return;
    }
    
    setIsExporting(true);
    try {
      const response = await api.get('/savings/transactions/export', {
        params: { 
          month: selectedMonth,
          type: filterType 
        },
        responseType: 'blob',
        timeout: 60000
      });
      
      const blob = new Blob([response.data], { 
        type: 'text/csv; charset=utf-8'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const monthNames: { [key: string]: string } = {
        '01': 'Januari', '02': 'Februari', '03': 'Maret', '04': 'April',
        '05': 'Mei', '06': 'Juni', '07': 'Juli', '08': 'Agustus',
        '09': 'September', '10': 'Oktober', '11': 'November', '12': 'Desember'
      };
      const [year, month] = selectedMonth.split('-');
      const monthName = monthNames[month] || month;
      const fileName = `riwayat_transaksi_${user?.name?.replace(/\s/g, '_')}_${monthName}_${year}.csv`;
      link.setAttribute('download', fileName);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      addNotification({
        title: 'Berhasil',
        message: `Riwayat transaksi bulan ${monthName} ${year} berhasil diekspor`,
        type: 'success'
      });
    } catch (error: any) {
      console.error('Export error:', error);
      addNotification({
        title: 'Gagal',
        message: 'Gagal mengekspor riwayat transaksi',
        type: 'error'
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Riwayat Transaksi</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Daftar lengkap seluruh aktivitas simpanan, pinjaman, dan transaksi pribadi Anda.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchHistory}
            disabled={isLoading}
            className="p-3 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-500 hover:text-imigrasi-primary transition-colors disabled:opacity-50"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
          </button>
          <button 
            onClick={handleExport}
            disabled={isExporting || filteredTransactions.length === 0}
            className="flex items-center gap-2 px-6 py-2 bg-imigrasi-primary text-white rounded-xl text-sm font-bold hover:bg-blue-900 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            {isExporting ? 'Mengekspor...' : 'Export CSV'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 rounded-3xl flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Cari berdasarkan jenis, kategori, atau deskripsi..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-2xl outline-none transition-all dark:text-white"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="month" 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-2xl outline-none transition-all dark:text-white text-sm font-bold"
            />
          </div>
          <div className="relative flex-1 md:flex-none">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full pl-12 pr-8 py-3 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-2xl outline-none transition-all dark:text-white text-sm font-bold appearance-none cursor-pointer"
            >
              <option value="all">Semua Jenis</option>
              <option value="saving">Simpanan Sukarela</option>
              <option value="payroll">Potongan Payroll (Wajib)</option>
              <option value="withdrawal">Penarikan Sukarela</option>
              <option value="loan_installment">Angsuran Pinjaman</option>
              <option value="loan">Pengajuan Pinjaman</option>
            </select>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Menampilkan <span className="font-bold text-gray-700 dark:text-gray-300">{filteredTransactions.length}</span> transaksi
        </p>
      </div>

      {/* Table */}
      <div className="glass-card rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-neutral-800/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-bold">Keterangan</th>
                <th className="px-6 py-4 font-bold">Tanggal</th>
                <th className="px-6 py-4 font-bold">Jumlah</th>
                <th className="px-6 py-4 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-700">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={`skeleton-${i}`} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-200 dark:bg-neutral-700 rounded-lg"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-32 mb-2"></div>
                          <div className="h-3 bg-gray-200 dark:bg-neutral-700 rounded w-48"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-24"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-20"></div></td>
                    <td className="px-6 py-4"><div className="h-6 bg-gray-200 dark:bg-neutral-700 rounded w-24"></div></td>
                  </tr>
                ))
              ) : filteredTransactions.length > 0 ? (
                filteredTransactions.map((trx, index) => (
                  <tr key={`${trx.id}-${index}`} className="hover:bg-gray-50 dark:hover:bg-neutral-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${getTransactionColor(trx.type, trx.transaction_type)}`}>
                          {getTransactionIcon(trx.type, trx.transaction_type)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">{trx.title}</p>
                          <p className="text-[10px] text-gray-500 font-mono">{trx.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                      {formatDate(trx.date)}
                    </td>
                    <td className={`px-6 py-4 text-sm font-bold whitespace-nowrap ${getAmountColor(trx)}`}>
                      {getAmountPrefix(trx)}{formatCurrency(trx.amount)}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(trx)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <HistoryIcon size={48} className="text-gray-300 dark:text-gray-600" />
                      <p className="text-gray-500 dark:text-gray-400">Tidak ada transaksi yang ditemukan.</p>
                      <button onClick={fetchHistory} className="mt-2 text-sm text-imigrasi-primary hover:underline flex items-center gap-1">
                        <RefreshCw size={14} /> Refresh data
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

export default HistoryPage;