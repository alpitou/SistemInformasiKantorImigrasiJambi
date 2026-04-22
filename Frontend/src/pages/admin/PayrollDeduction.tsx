import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wallet, TrendingUp, Users, Calendar, RefreshCw, 
  CheckCircle2, XCircle, Clock, Search, FileText,
  AlertCircle, Save, User, History, Download
} from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import axios from 'axios';

interface Member {
  id: number;
  name: string;
  nip: string;
  unit: string;
  is_old_member: boolean;
  already_processed: boolean;
  savings: {
    type_id: number;
    type_name: string;
    default_amount: number;
    current_balance: number;
    is_processed: boolean;
  }[];
}

interface PayrollHistory {
  id: number;
  user_id: number;
  user: {
    id: number;
    name: string;
    nip: string;
    unit: string;
  };
  saving_type: {
    id: number;
    name: string;
  };
  amount: number;
  month: string;
  processed_at: string;
  creator: string;
}

const PayrollDeduction: React.FC = () => {
  const { addNotification } = useNotifications();
  const [isLoading, setIsLoading] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    const day = now.getDate();
    if (day >= 25) {
      return new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().slice(0, 7);
    }
    return now.toISOString().slice(0, 7);
  });
  const [editedAmounts, setEditedAmounts] = useState<Record<number, Record<number, number>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<Record<string, PayrollHistory[]>>({});
  const [isExporting, setIsExporting] = useState(false);
  const [payrollPeriod, setPayrollPeriod] = useState<any>(null);

  const token = localStorage.getItem('token');
  const axiosInstance = useMemo(() => axios.create({
    baseURL: '/api',
    headers: { Authorization: `Bearer ${token}` }
  }), [token]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR', 
      minimumFractionDigits: 0 
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMonthName = (monthString: string) => {
    const [year, month] = monthString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  };

  const checkPayrollPeriod = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/savings/payroll/check-period');
      if (response.data.success) {
        setPayrollPeriod(response.data.data);
      }
    } catch (error) {
      console.error('Failed to check payroll period:', error);
    }
  }, [axiosInstance]);

  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get('/savings/payroll/members');
      if (response.data.success) {
        setMembers(response.data.data);
        setFilteredMembers(response.data.data);
        
        const initialEdits: Record<number, Record<number, number>> = {};
        response.data.data.forEach((member: Member) => {
          initialEdits[member.id] = {};
          member.savings.forEach(saving => {
            if (saving.is_processed) {
              initialEdits[member.id][saving.type_id] = 0;
            } else {
              initialEdits[member.id][saving.type_id] = saving.default_amount;
            }
          });
        });
        setEditedAmounts(initialEdits);
      }
    } catch (error: any) {
      addNotification({ 
        title: 'Error', 
        message: error.response?.data?.message || 'Gagal mengambil data anggota', 
        type: 'error' 
      });
    } finally {
      setIsLoading(false);
    }
  }, [axiosInstance, addNotification]);

  const fetchHistory = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/savings/payroll/history');
      if (response.data.success) {
        setHistory(response.data.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch history:', error);
    }
  }, [axiosInstance]);

  useEffect(() => {
    checkPayrollPeriod();
    fetchMembers();
    fetchHistory();
  }, [checkPayrollPeriod, fetchMembers, fetchHistory]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = members.filter(member =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.nip.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.unit.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredMembers(filtered);
    } else {
      setFilteredMembers(members);
    }
  }, [searchTerm, members]);

  const handleAmountChange = (memberId: number, typeId: number, value: string) => {
    const amount = parseFloat(value) || 0;
    setEditedAmounts(prev => ({ 
      ...prev, 
      [memberId]: { ...prev[memberId], [typeId]: amount } 
    }));
  };

  const handleProcessPayroll = async () => {
    if (payrollPeriod && !payrollPeriod.is_active) {
      addNotification({ 
        title: 'Periode Tidak Aktif', 
        message: 'Payroll hanya dapat diproses pada tanggal 25 sampai 5 bulan berikutnya.', 
        type: 'error' 
      });
      return;
    }

    const deductions = [];
    for (const member of filteredMembers) {
      for (const saving of member.savings) {
        const amount = editedAmounts[member.id]?.[saving.type_id] || 0;
        if (amount > 0 && !saving.is_processed) {
          deductions.push({ 
            user_id: member.id, 
            saving_type_id: saving.type_id, 
            amount: amount 
          });
        }
      }
    }
    
    if (deductions.length === 0) {
      addNotification({ 
        title: 'Validasi Gagal', 
        message: 'Tidak ada potongan yang akan diproses.', 
        type: 'error' 
      });
      return;
    }
    
    if (!window.confirm(`Proses potongan payroll untuk ${deductions.length} item?\n\nPeriode: ${getMonthName(selectedMonth)}`)) return;
    
    setIsSubmitting(true);
    try {
      const response = await axiosInstance.post('/savings/payroll/process', { 
        month: selectedMonth, 
        deductions: deductions 
      });
      
      if (response.data.success) {
        addNotification({ 
          title: 'Berhasil', 
          message: response.data.message, 
          type: 'success' 
        });
        
        await fetchMembers();
        await fetchHistory();
      }
    } catch (error: any) {
      addNotification({ 
        title: 'Gagal', 
        message: error.response?.data?.message || 'Gagal memproses potongan', 
        type: 'error' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const response = await axiosInstance.get('/savings/payroll/export', {
        params: { month: selectedMonth },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `riwayat_payroll_${selectedMonth}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      addNotification({
        title: 'Berhasil',
        message: 'Laporan berhasil diunduh',
        type: 'success'
      });
    } catch (error: any) {
      addNotification({
        title: 'Gagal',
        message: 'Gagal mengunduh laporan',
        type: 'error'
      });
    } finally {
      setIsExporting(false);
    }
  };

  const totalPotongan = filteredMembers.reduce((sum, member) => {
    return sum + member.savings.reduce((sSum, saving) => {
      const amount = editedAmounts[member.id]?.[saving.type_id] || 0;
      return sSum + (saving.is_processed ? 0 : amount);
    }, 0);
  }, 0);

  const alreadyProcessedCount = filteredMembers.filter(m => m.already_processed).length;
  const pendingCount = filteredMembers.length - alreadyProcessedCount;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw size={40} className="animate-spin text-imigrasi-primary mx-auto mb-4" />
          <p className="text-gray-500">Memuat data anggota...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Potongan Payroll Simpanan</h1>
          <p className="text-gray-500 dark:text-gray-400">Kelola potongan gaji untuk simpanan pokok dan wajib anggota</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <div className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">Anggota lama tidak perlu bayar Pokok</div>
            <div className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">Hanya anggota yang dipotong</div>
            <div className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full">Periode aktif: 25 - 5 bulan berikutnya</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors"
          >
            <History size={18} />
            {showHistory ? 'Tutup Riwayat' : 'Lihat Riwayat'}
          </button>
          <button 
            onClick={handleExportCSV}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-colors disabled:opacity-50"
          >
            {isExporting ? <RefreshCw size={18} className="animate-spin" /> : <Download size={18} />}
            Export CSV
          </button>
          <button 
            onClick={() => { fetchMembers(); fetchHistory(); }}
            className="p-3 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-500 hover:text-imigrasi-primary transition-colors"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {payrollPeriod && !payrollPeriod.is_active && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-red-500" size={20} />
            <div>
              <p className="text-sm font-bold text-red-700 dark:text-red-400">Periode Payroll Tidak Aktif</p>
              <p className="text-xs text-red-600 dark:text-red-300">
                Payroll hanya dapat diproses pada tanggal 25 sampai 5 bulan berikutnya.
              </p>
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="glass-card p-6 rounded-3xl">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <History size={20} /> Riwayat Potongan Payroll
              </h3>
              {Object.keys(history).length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-neutral-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock size={32} className="text-gray-400" />
                  </div>
                  <p className="text-gray-500">Belum ada riwayat potongan payroll</p>
                </div>
              ) : (
                <div className="space-y-6 max-h-96 overflow-y-auto">
                  {Object.entries(history).map(([month, deductions]) => (
                    <div key={month} className="border-b border-gray-100 dark:border-neutral-700 pb-4 last:border-0">
                      <h4 className="font-bold text-imigrasi-primary mb-3 flex items-center gap-2">
                        <Calendar size={16} />
                        {getMonthName(month)}
                      </h4>
                      <div className="space-y-2">
                        {deductions.map((deduction) => (
                          <div key={deduction.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-neutral-700/30 rounded-lg">
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{deduction.user.name}</p>
                              <p className="text-xs text-gray-500">NIP: {deduction.user.nip}</p>
                              <p className="text-xs text-gray-500">{deduction.saving_type.name}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(deduction.amount)}
                              </p>
                              <p className="text-[10px] text-gray-400">
                                {deduction.processed_at ? formatDate(deduction.processed_at) : '-'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="glass-card p-6 rounded-3xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-imigrasi-primary/10 rounded-xl">
              <Calendar size={24} className="text-imigrasi-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Periode Potongan</p>
              <p className="text-xs text-gray-500">Pilih bulan dan tahun untuk potongan payroll</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:border-imigrasi-primary outline-none dark:text-white"
            />
            <button 
              onClick={handleProcessPayroll}
              disabled={isSubmitting || (payrollPeriod && !payrollPeriod.is_active)}
              className="px-6 py-2 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
              Proses Potongan
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card p-4 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <p className="text-sm opacity-80">Total Anggota</p>
          <p className="text-2xl font-bold">{filteredMembers.length}</p>
        </div>
        <div className="glass-card p-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
          <p className="text-sm opacity-80">Total Potongan</p>
          <p className="text-2xl font-bold">{formatCurrency(totalPotongan)}</p>
        </div>
        <div className="glass-card p-4 rounded-2xl bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <p className="text-sm opacity-80">Sudah Diproses</p>
          <p className="text-2xl font-bold">{alreadyProcessedCount}</p>
        </div>
        <div className="glass-card p-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-white">
          <p className="text-sm opacity-80">Periode</p>
          <p className="text-xl font-bold">{getMonthName(selectedMonth)}</p>
        </div>
      </div>

      <div className="flex-1 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Cari berdasarkan nama, NIP, atau unit kerja..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:border-imigrasi-primary outline-none transition-colors dark:text-white"
        />
      </div>

      <div className="space-y-4">
        {filteredMembers.length === 0 ? (
          <div className="glass-card p-12 rounded-3xl text-center">
            <div className="w-20 h-20 bg-gray-100 dark:bg-neutral-700 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Users size={40} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Tidak Ada Data Anggota</h3>
            <p className="text-sm text-gray-500 mt-2">
              {searchTerm ? 'Tidak ditemukan anggota yang sesuai.' : 'Belum ada anggota yang terdaftar.'}
            </p>
          </div>
        ) : (
          filteredMembers.map((member) => (
            <div key={member.id} className="glass-card p-6 rounded-3xl hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <img 
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`} 
                    alt="" 
                    className="w-14 h-14 rounded-2xl border-2 border-gray-100 dark:border-neutral-700" 
                  />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-gray-900 dark:text-white">{member.name}</h4>
                      {member.is_old_member && (
                        <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                          Anggota Lama (Pokok Lunas)
                        </span>
                      )}
                      {member.already_processed && (
                        <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                          Sudah Diproses Bulan Ini
                        </span>
                      )}
                    </div>
                    <div className="flex gap-3 mt-1 text-xs text-gray-500">
                      <span>NIP: {member.nip || '-'}</span>
                      <span>Unit: {member.unit || '-'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-100 dark:border-neutral-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {member.savings.map((saving) => {
                    const isDisabled = (saving.type_name === 'Pokok' && member.is_old_member) || saving.is_processed;
                    const currentAmount = editedAmounts[member.id]?.[saving.type_id] || saving.default_amount;
                    
                    return (
                      <div key={saving.type_id} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
                            Simpanan {saving.type_name}
                            {saving.is_processed && (
                              <span className="ml-2 text-[10px] text-blue-600">(Sudah Diproses)</span>
                            )}
                            {saving.type_name === 'Pokok' && member.is_old_member && !saving.is_processed && (
                              <span className="ml-2 text-[10px] text-green-600">(Lunas - Tidak perlu potong)</span>
                            )}
                          </label>
                          <span className="text-xs text-gray-500">
                            Saldo: {formatCurrency(saving.current_balance)}
                          </span>
                        </div>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">Rp</span>
                          <input
                            type="number"
                            value={currentAmount}
                            onChange={(e) => handleAmountChange(member.id, saving.type_id, e.target.value)}
                            disabled={isDisabled}
                            className={`w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-neutral-700 border-2 rounded-xl outline-none transition-all dark:text-white ${
                              isDisabled 
                                ? 'border-gray-200 opacity-50 cursor-not-allowed' 
                                : 'border-transparent focus:border-imigrasi-primary'
                            }`}
                          />
                        </div>
                        {!isDisabled && (
                          <p className="text-[10px] text-gray-400">
                            Potongan default: {formatCurrency(saving.default_amount)}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
};

export default PayrollDeduction;