import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wallet, TrendingUp, Users, Calendar, RefreshCw, 
  CheckCircle2, XCircle, Clock, Search, FileText,
  AlertCircle, Save, User, History, Download, HandCoins,
  FileSpreadsheet
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
  has_active_loan: boolean;
  loan_installment: number;
  loan_remaining: number;
  loan_already_processed: boolean;
  savings: {
    type_id: number;
    type_name: string;
    default_amount: number;
    current_balance: number;
    is_processed: boolean;
  }[];
}

interface PayrollHistoryItem {
  id: number;
  type: string;
  user_id: number;
  user_name: string;
  user_nip: string;
  user_unit: string;
  saving_type?: string;
  amount: number;
  date: string;
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
    return now.toISOString().slice(0, 7);
  });
  const [editedAmounts, setEditedAmounts] = useState<Record<number, Record<number, number>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<Record<string, any>>({});
  const [isExporting, setIsExporting] = useState(false);
  const [processLoanInstallments, setProcessLoanInstallments] = useState(true);

  const token = localStorage.getItem('token');
  const axiosInstance = useMemo(() => axios.create({
    baseURL: '/api',
    headers: { Authorization: `Bearer ${token}` }
  }), [token]);

  const formatCurrency = (amount: number) => {
    if (isNaN(amount) || amount === null || amount === undefined) {
      return 'Rp 0';
    }
    return new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR', 
      minimumFractionDigits: 0 
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return '-';
    }
  };

  const getMonthName = (monthString: string) => {
    const [year, month] = monthString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  };

  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get('/savings/payroll/members', {
        params: { month: selectedMonth }
      });
      
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
      console.error('Error fetching members:', error);
      addNotification({ 
        title: 'Error', 
        message: error.response?.data?.message || 'Gagal mengambil data anggota', 
        type: 'error' 
      });
    } finally {
      setIsLoading(false);
    }
  }, [axiosInstance, addNotification, selectedMonth]);

  const fetchHistory = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/savings/payroll/history');
      if (response.data.success) {
        setHistory(response.data.data);
      } else {
        setHistory({});
      }
    } catch (error: any) {
      console.error('Failed to fetch history:', error);
      setHistory({});
    }
  }, [axiosInstance]);

  useEffect(() => {
    fetchMembers();
    fetchHistory();
  }, [fetchMembers, fetchHistory, selectedMonth]);

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
    
    const membersWithLoan = filteredMembers.filter(m => m.has_active_loan && !m.loan_already_processed);
    
    let confirmMessage = `⚠️ KONFIRMASI POTONGAN PAYROLL ⚠️\n\n`;
    confirmMessage += `📅 Periode: ${getMonthName(selectedMonth)}\n`;
    confirmMessage += `💰 Potongan Simpanan: ${deductions.length} item\n`;
    if (deductions.length > 0) {
      confirmMessage += `💰 Total Simpanan: ${formatCurrency(deductions.reduce((sum, d) => sum + d.amount, 0))}\n`;
    }
    if (processLoanInstallments && membersWithLoan.length > 0) {
      confirmMessage += `\n🏦 Potongan Angsuran Pinjaman:\n`;
      membersWithLoan.forEach(m => {
        confirmMessage += `   - ${m.name}: ${formatCurrency(m.loan_installment)}\n`;
      });
    }
    confirmMessage += `\n⚠️ Pastikan data sudah benar sebelum memproses!`;
    
    if (deductions.length === 0 && (!processLoanInstallments || membersWithLoan.length === 0)) {
      addNotification({ 
        title: 'Validasi Gagal', 
        message: 'Tidak ada potongan yang akan diproses.', 
        type: 'error' 
      });
      return;
    }
    
    if (!window.confirm(confirmMessage)) return;
    
    setIsSubmitting(true);
    try {
      const response = await axiosInstance.post('/savings/payroll/process', { 
        month: selectedMonth, 
        deductions: deductions,
        process_loan_installments: processLoanInstallments
      });
      
      if (response.data.success) {
        addNotification({ 
          title: '✅ Berhasil', 
          message: response.data.message, 
          type: 'success' 
        });
        
        await fetchMembers();
        await fetchHistory();
      }
    } catch (error: any) {
      addNotification({ 
        title: '❌ Gagal', 
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
      
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv;charset=utf-8;' }));
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
      console.error('Export error:', error);
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

  const totalLoanPotongan = filteredMembers.reduce((sum, member) => {
    return sum + (member.has_active_loan && processLoanInstallments && !member.loan_already_processed ? member.loan_installment : 0);
  }, 0);

  const alreadyProcessedCount = filteredMembers.filter(m => m.already_processed).length;
  const membersWithLoanCount = filteredMembers.filter(m => m.has_active_loan).length;
  const pendingLoanCount = filteredMembers.filter(m => m.has_active_loan && !m.loan_already_processed).length;

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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">💳 Potongan Payroll Simpanan</h1>
          <p className="text-gray-500 dark:text-gray-400">Kelola potongan gaji untuk simpanan pokok, wajib, dan angsuran pinjaman anggota</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <div className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">✅ Anggota lama tidak perlu bayar Pokok</div>
            <div className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">👥 Hanya anggota yang dipotong</div>
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
            onClick={() => { fetchMembers(); fetchHistory(); }}
            className="p-3 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-500 hover:text-imigrasi-primary transition-colors"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Export Section - SATU SATUNYA EKSPOR */}
      <div className="glass-card p-6 rounded-3xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 rounded-xl">
              <FileSpreadsheet size={24} className="text-emerald-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-700 dark:text-gray-300">📊 Ekspor Data Potongan</p>
              <p className="text-xs text-gray-500">Ekspor data potongan ke file CSV untuk keperluan payroll</p>
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
              onClick={handleExportCSV}
              disabled={isExporting}
              className="px-6 py-2 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-colors flex items-center gap-2"
            >
              {isExporting ? <RefreshCw size={18} className="animate-spin" /> : <Download size={18} />}
              Ekspor Data
            </button>
          </div>
        </div>
      </div>

      {/* History Panel */}
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
                <History size={20} /> 📋 Riwayat Potongan Payroll
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
                  {Object.entries(history).map(([month, data]: [string, any]) => (
                    <div key={month} className="border-b border-gray-100 dark:border-neutral-700 pb-4 last:border-0">
                      <h4 className="font-bold text-imigrasi-primary mb-3 flex items-center gap-2">
                        <Calendar size={16} />
                        📅 {data.name || month}
                      </h4>
                      <div className="space-y-2">
                        {data.items?.map((item: PayrollHistoryItem, idx: number) => (
                          <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-neutral-700/30 rounded-lg hover:bg-gray-100 transition-colors">
                            <div>
                              <div className="flex items-center gap-2">
                                <Wallet size={14} className="text-emerald-600" />
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{item.user_name}</p>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">🆔 NIP: {item.user_nip}</p>
                              <p className="text-xs text-gray-500">💰 {item.saving_type}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(item.amount)}
                              </p>
                              <p className="text-[10px] text-gray-400">
                                {formatDate(item.date)}
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

      {/* Month Selector & Process */}
      <div className="glass-card p-6 rounded-3xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-imigrasi-primary/10 rounded-xl">
              <Calendar size={24} className="text-imigrasi-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-700 dark:text-gray-300">📅 Periode Potongan</p>
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
              disabled={isSubmitting}
              className="px-6 py-2 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-colors flex items-center gap-2"
            >
              {isSubmitting ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
              Proses Potongan
            </button>
          </div>
        </div>
        
        {/* Checkbox untuk potong angsuran */}
        <div className="mt-4 flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
          <input
            type="checkbox"
            id="processLoanInstallments"
            checked={processLoanInstallments}
            onChange={(e) => setProcessLoanInstallments(e.target.checked)}
            className="w-4 h-4 text-imigrasi-primary rounded focus:ring-imigrasi-primary"
          />
          <label htmlFor="processLoanInstallments" className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2 cursor-pointer">
            <HandCoins size={16} />
            🔄 Potong otomatis angsuran pinjaman anggota yang aktif
          </label>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="glass-card p-4 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <p className="text-sm opacity-80">👥 Total Anggota</p>
          <p className="text-2xl font-bold">{filteredMembers.length}</p>
        </div>
        <div className="glass-card p-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
          <p className="text-sm opacity-80">💰 Total Potongan Simpanan</p>
          <p className="text-2xl font-bold">{formatCurrency(totalPotongan)}</p>
        </div>
        <div className="glass-card p-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-white">
          <p className="text-sm opacity-80">🏦 Total Potongan Angsuran</p>
          <p className="text-2xl font-bold">{formatCurrency(totalLoanPotongan)}</p>
        </div>
        <div className="glass-card p-4 rounded-2xl bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <p className="text-sm opacity-80">📊 Anggota dengan Pinjaman</p>
          <p className="text-2xl font-bold">{membersWithLoanCount}</p>
        </div>
        <div className="glass-card p-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
          <p className="text-sm opacity-80">⏳ Menunggu Angsuran</p>
          <p className="text-2xl font-bold">{pendingLoanCount}</p>
        </div>
        <div className="glass-card p-4 rounded-2xl bg-gradient-to-r from-pink-500 to-pink-600 text-white">
          <p className="text-sm opacity-80">📅 Periode</p>
          <p className="text-xl font-bold">{getMonthName(selectedMonth)}</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex-1 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="🔍 Cari berdasarkan nama, NIP, atau unit kerja..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:border-imigrasi-primary outline-none transition-colors dark:text-white"
        />
      </div>

      {/* Members List */}
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
                          ✅ Anggota Lama (Pokok Lunas)
                        </span>
                      )}
                      {member.already_processed && (
                        <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                          ✓ Sudah Diproses Bulan Ini
                        </span>
                      )}
                      {member.has_active_loan && (
                        <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                          🏦 Pinjaman Aktif
                        </span>
                      )}
                    </div>
                    <div className="flex gap-3 mt-1 text-xs text-gray-500">
                      <span>🆔 NIP: {member.nip || '-'}</span>
                      <span>🏢 Unit: {member.unit || '-'}</span>
                    </div>
                    {member.has_active_loan && (
                      <div className="flex gap-3 mt-1 text-xs flex-wrap">
                        <span className="text-amber-600">💰 Angsuran: {formatCurrency(member.loan_installment)}</span>
                        <span className="text-gray-500">📊 Sisa Pinjaman: {formatCurrency(member.loan_remaining)}</span>
                        {member.loan_already_processed ? (
                          <span className="text-blue-600">✅ Angsuran sudah dipotong bulan ini</span>
                        ) : (
                          <span className="text-amber-600">⏳ Akan dipotong bulan ini</span>
                        )}
                      </div>
                    )}
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
                            💰 Simpanan {saving.type_name}
                            {saving.is_processed && (
                              <span className="ml-2 text-[10px] text-blue-600">(✓ Sudah Diproses)</span>
                            )}
                            {saving.type_name === 'Pokok' && member.is_old_member && !saving.is_processed && (
                              <span className="ml-2 text-[10px] text-green-600">(✅ Lunas - Tidak perlu potong)</span>
                            )}
                          </label>
                          <span className="text-xs text-gray-500">
                            💵 Saldo: {formatCurrency(saving.current_balance)}
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
                            📋 Potongan default: {formatCurrency(saving.default_amount)}
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