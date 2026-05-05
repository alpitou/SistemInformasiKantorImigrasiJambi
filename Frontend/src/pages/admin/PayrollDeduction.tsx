import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wallet, Users, Calendar, RefreshCw, 
  CheckCircle2, Clock, Search, 
  Save, History, Download, HandCoins,
  FileSpreadsheet, Settings, Info, Coins, ShieldCheck,
  ChevronDown, ChevronUp, AlertCircle, TrendingUp,
  User
} from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import axios from 'axios';

interface SavingType {
  id: number;
  name: string;
  default_amount: number;
}

interface MemberSaving {
  type_id: number;
  type_name: string;
  default_amount: number;
  current_balance: number;
  is_processed: boolean;
  is_applicable: boolean;
  remaining_to_pay: number;
}

interface ActiveLoan {
  id: number;
  amount: number;
  monthly_installment: number;
  remaining_balance: number;
  interest_rate: number;
  tenor_months: number;
  installments_paid?: number;
  paid_count?: number;
}

interface Member {
  id: number;
  name: string;
  nip: string;
  unit: string;
  join_date: string;
  already_processed_savings: boolean;
  has_active_loan: boolean;
  active_loans?: ActiveLoan[];  // Array untuk multiple loans
  loan_installment?: number;     // Legacy: single loan installment
  loan_remaining?: number;       // Legacy: single loan remaining
  total_loan_installment: number;  // Total angsuran dari semua pinjaman aktif
  total_loan_remaining: number;     // Total sisa dari semua pinjaman aktif
  loan_already_processed: boolean;
  savings: MemberSaving[];
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
  const [savingTypes, setSavingTypes] = useState<SavingType[]>([]);
  const [expandedMembers, setExpandedMembers] = useState<Set<number>>(new Set());

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
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatCurrencyDecimal = (amount: number) => {
    if (isNaN(amount) || amount === null || amount === undefined) {
      return 'Rp 0';
    }
    return new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR', 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
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

  const fetchSavingTypes = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/saving-types');
      if (response.data.success && response.data.data) {
        setSavingTypes(response.data.data);
      }
    } catch (error: any) {
      console.error('Error fetching saving types:', error);
      setSavingTypes([
        { id: 1, name: 'Pokok', default_amount: 100000 },
        { id: 2, name: 'Wajib', default_amount: 50000 },
        { id: 3, name: 'Sukarela', default_amount: 0 }
      ]);
    }
  }, [axiosInstance]);

  // Helper function untuk mendapatkan active loans dari response API
  const getActiveLoans = useCallback((member: any): ActiveLoan[] => {
    // Cek apakah response menggunakan active_loans array (format baru)
    if (member.active_loans && Array.isArray(member.active_loans) && member.active_loans.length > 0) {
      return member.active_loans.map((loan: any) => ({
        id: loan.id,
        amount: loan.amount,
        monthly_installment: loan.monthly_installment,
        remaining_balance: loan.remaining_balance,
        interest_rate: loan.interest_rate,
        tenor_months: loan.tenor_months,
        installments_paid: loan.installments_paid || loan.paid_count || 0
      }));
    }
    
    // Fallback: jika masih menggunakan format single loan (loan_installment)
    if (member.has_active_loan && member.loan_installment && member.loan_installment > 0) {
      return [{
        id: member.id,
        amount: member.loan_amount || 0,
        monthly_installment: member.loan_installment,
        remaining_balance: member.loan_remaining || 0,
        interest_rate: member.interest_rate || 1,
        tenor_months: member.tenor_months || 10,
        installments_paid: member.installments_paid || 0
      }];
    }
    
    return [];
  }, []);

  // Helper function untuk mendapatkan total angsuran pinjaman
  const getTotalLoanInstallment = useCallback((member: any): number => {
    // Jika sudah ada total_loan_installment dari API
    if (member.total_loan_installment !== undefined && member.total_loan_installment > 0) {
      return member.total_loan_installment;
    }
    
    // Hitung dari active_loans
    const loans = getActiveLoans(member);
    return loans.reduce((sum, loan) => sum + loan.monthly_installment, 0);
  }, [getActiveLoans]);

  // Helper function untuk mendapatkan detail loans
  const getMemberLoans = useCallback((member: any): ActiveLoan[] => {
    return getActiveLoans(member);
  }, [getActiveLoans]);

  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get('/savings/payroll/members', {
        params: { month: selectedMonth }
      });
      
      console.log('API Response members:', response.data);
      
      if (response.data.success) {
        // Process members to ensure consistent data structure
        const processedMembers = response.data.data.map((member: any) => {
          const activeLoans = getActiveLoans(member);
          const totalLoanInstallment = getTotalLoanInstallment(member);
          
          return {
            ...member,
            active_loans: activeLoans,
            total_loan_installment: totalLoanInstallment,
            total_loan_remaining: activeLoans.reduce((sum, loan) => sum + loan.remaining_balance, 0),
            // Pastikan has_active_loan konsisten
            has_active_loan: activeLoans.length > 0 || member.has_active_loan
          };
        });
        
        setMembers(processedMembers);
        setFilteredMembers(processedMembers);
        
        const initialEdits: Record<number, Record<number, number>> = {};
        processedMembers.forEach((member: Member) => {
          initialEdits[member.id] = {};
          member.savings.forEach(saving => {
            if (saving.is_applicable && !saving.is_processed) {
              let amount = 0;
              
              if (saving.type_name === 'Pokok') {
                amount = Math.min(saving.default_amount, saving.remaining_to_pay);
              } else if (saving.type_name === 'Wajib') {
                amount = saving.default_amount;
              }
              
              initialEdits[member.id][saving.type_id] = amount;
            } else {
              initialEdits[member.id][saving.type_id] = 0;
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
  }, [axiosInstance, addNotification, selectedMonth, getActiveLoans, getTotalLoanInstallment]);

  const fetchHistory = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/savings/payroll/history');
      if (response.data.success) {
        setHistory(response.data.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch history:', error);
      setHistory({});
    }
  }, [axiosInstance]);

  useEffect(() => {
    fetchSavingTypes();
  }, [fetchSavingTypes]);

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

  const toggleMemberExpand = (memberId: number) => {
    setExpandedMembers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(memberId)) {
        newSet.delete(memberId);
      } else {
        newSet.add(memberId);
      }
      return newSet;
    });
  };

  const getMemberTotal = useCallback((member: Member) => {
    let total = 0;
    for (const saving of member.savings) {
      const amount = editedAmounts[member.id]?.[saving.type_id] || 0;
      if (saving.is_applicable && !saving.is_processed && amount > 0) {
        total += amount;
      }
    }
    return total;
  }, [editedAmounts]);

  const getMemberLoanTotal = useCallback((member: Member) => {
    if (!processLoanInstallments || member.loan_already_processed) return 0;
    // Gunakan total_loan_installment yang sudah dihitung
    return member.total_loan_installment || 0;
  }, [processLoanInstallments]);

  const getMemberLoansList = useCallback((member: Member): ActiveLoan[] => {
    return member.active_loans || [];
  }, []);

  const handleProcessPayroll = async () => {
    const deductions = [];
    for (const member of filteredMembers) {
      for (const saving of member.savings) {
        const amount = editedAmounts[member.id]?.[saving.type_id] || 0;
        if (amount > 0 && saving.is_applicable && !saving.is_processed) {
          deductions.push({ 
            user_id: member.id, 
            saving_type_id: saving.type_id, 
            amount: amount 
          });
        }
      }
    }
    
    const membersWithLoan = filteredMembers.filter(m => 
      m.has_active_loan && 
      processLoanInstallments && 
      !m.loan_already_processed &&
      m.total_loan_installment > 0
    );
    
    if (deductions.length === 0 && membersWithLoan.length === 0) {
      addNotification({ 
        title: 'Validasi Gagal', 
        message: 'Tidak ada potongan yang akan diproses.', 
        type: 'error' 
      });
      return;
    }
    
    const totalSavingsDeduction = deductions.reduce((sum, d) => sum + d.amount, 0);
    const totalLoanDeduction = membersWithLoan.reduce((sum, m) => sum + (m.total_loan_installment || 0), 0);
    
    let confirmMessage = `⚠️ KONFIRMASI POTONGAN PAYROLL ⚠️\n\n`;
    confirmMessage += `📅 Periode: ${getMonthName(selectedMonth)}\n`;
    confirmMessage += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    if (deductions.length > 0) {
      confirmMessage += `💰 POTONGAN SIMPANAN (${deductions.length} item):\n`;
      confirmMessage += `   Total Simpanan: ${formatCurrency(totalSavingsDeduction)}\n\n`;
    }
    
    if (membersWithLoan.length > 0) {
      confirmMessage += `🏦 POTONGAN ANGSURAN PINJAMAN:\n`;
      confirmMessage += `   Jumlah anggota: ${membersWithLoan.length}\n`;
      confirmMessage += `   Total: ${formatCurrency(totalLoanDeduction)}\n\n`;
    }
    
    confirmMessage += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    confirmMessage += `💰 TOTAL KESELURUHAN: ${formatCurrency(totalSavingsDeduction + totalLoanDeduction)}\n\n`;
    confirmMessage += `⚠️ Pastikan data sudah benar sebelum memproses!`;
    
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
      } else {
        addNotification({ 
          title: '❌ Gagal', 
          message: response.data.message || 'Gagal memproses potongan', 
          type: 'error' 
        });
      }
    } catch (error: any) {
      console.error('Process error:', error);
      addNotification({ 
        title: '❌ Gagal', 
        message: error.response?.data?.message || error.message || 'Terjadi kesalahan saat memproses', 
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
      link.setAttribute('download', `payroll_${selectedMonth}.csv`);
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

  const calculateTotals = useCallback(() => {
    let totalSavings = 0;
    let totalLoan = 0;
    let pokokTotal = 0;
    let wajibTotal = 0;
    let pokokCount = 0;
    let wajibCount = 0;
    
    for (const member of filteredMembers) {
      for (const saving of member.savings) {
        const amount = editedAmounts[member.id]?.[saving.type_id] || 0;
        if (amount > 0 && saving.is_applicable && !saving.is_processed) {
          totalSavings += amount;
          if (saving.type_name === 'Pokok') {
            pokokTotal += amount;
            pokokCount++;
          } else if (saving.type_name === 'Wajib') {
            wajibTotal += amount;
            wajibCount++;
          }
        }
      }
      
      if (member.has_active_loan && processLoanInstallments && !member.loan_already_processed && member.total_loan_installment > 0) {
        totalLoan += member.total_loan_installment;
      }
    }
    
    return {
      totalSavings,
      totalLoan,
      totalAll: totalSavings + totalLoan,
      pokokTotal,
      wajibTotal,
      pokokCount,
      wajibCount,
      loanCount: filteredMembers.filter(m => m.has_active_loan && !m.loan_already_processed && (m.total_loan_installment || 0) > 0).length
    };
  }, [filteredMembers, editedAmounts, processLoanInstallments]);

  const totals = calculateTotals();
  
  const stats = {
    totalMembers: filteredMembers.length,
    activeLoanMembers: filteredMembers.filter(m => m.has_active_loan).length,
    pendingLoanMembers: filteredMembers.filter(m => m.has_active_loan && !m.loan_already_processed && (m.total_loan_installment || 0) > 0).length,
    processedMembers: filteredMembers.filter(m => m.already_processed_savings).length,
  };

  if (isLoading && members.length === 0) {
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Wallet size={28} className="text-imigrasi-primary" />
            Potongan Payroll Bulanan
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Kelola potongan gaji bulanan untuk simpanan pokok, wajib, dan angsuran pinjaman
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-neutral-800 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <History size={18} />
            {showHistory ? 'Tutup Riwayat' : 'Lihat Riwayat'}
          </button>
          <button 
            onClick={() => { fetchMembers(); fetchHistory(); }}
            className="p-2.5 bg-white dark:bg-neutral-800 border border-gray-200 rounded-xl text-gray-500 hover:text-imigrasi-primary transition-colors"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-imigrasi-primary to-blue-700 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs opacity-80 mb-1">Total Anggota</p>
              <p className="text-2xl font-bold">{stats.totalMembers}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Users size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-imigrasi-primary to-blue-700 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs opacity-80 mb-1">Potongan Simpanan</p>
              <p className="text-xl font-bold">{formatCurrency(totals.totalSavings)}</p>
              <p className="text-[10px] opacity-70 mt-1">Pokok: {totals.pokokCount} • Wajib: {totals.wajibCount}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Coins size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-imigrasi-primary to-blue-700 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs opacity-80 mb-1">Potongan Angsuran</p>
              <p className="text-xl font-bold">{formatCurrency(totals.totalLoan)}</p>
              <p className="text-[10px] opacity-70 mt-1">{totals.loanCount} anggota</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <HandCoins size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-imigrasi-primary to-blue-700 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs opacity-80 mb-1">TOTAL POTONGAN</p>
              <p className="text-2xl font-bold">{formatCurrency(totals.totalAll)}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <TrendingUp size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <Calendar size={14} />
              Periode Potongan
            </label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-imigrasi-primary outline-none"
            />
            <p className="text-xs text-gray-400 mt-1">
              Menampilkan data untuk {getMonthName(selectedMonth)}
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <Search size={14} />
              Cari Anggota
            </label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Cari berdasarkan nama atau NIP..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-imigrasi-primary outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Process Button Section */}
      <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Settings size={24} className="text-imigrasi-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700">Proses Potongan Bulanan</p>
              <p className="text-xs text-gray-500">Proses potongan untuk periode {getMonthName(selectedMonth)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-xl">
              <input
                type="checkbox"
                id="processLoanInstallments"
                checked={processLoanInstallments}
                onChange={(e) => setProcessLoanInstallments(e.target.checked)}
                className="w-4 h-4 text-imigrasi-primary rounded"
              />
              <label htmlFor="processLoanInstallments" className="text-xs text-gray-600 cursor-pointer">
                Potong angsuran pinjaman
              </label>
            </div>
            <button 
              onClick={handleProcessPayroll}
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-imigrasi-primary text-white rounded-xl text-sm font-semibold hover:bg-blue-800 transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
              Proses Potongan
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
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                <History size={20} className="text-imigrasi-primary" />
                Riwayat Potongan Payroll
              </h3>
              {Object.keys(history).length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock size={32} className="text-gray-400" />
                  </div>
                  <p className="text-gray-500">Belum ada riwayat potongan payroll</p>
                </div>
              ) : (
                <div className="space-y-6 max-h-96 overflow-y-auto">
                  {Object.entries(history).map(([month, data]: [string, any]) => (
                    <div key={month} className="border-b border-gray-100 pb-4 last:border-0">
                      <h4 className="font-bold text-imigrasi-primary mb-3 flex items-center gap-2">
                        <Calendar size={16} />
                        {data.name || month}
                      </h4>
                      <div className="space-y-2">
                        {data.items?.slice(0, 10).map((item: PayrollHistoryItem, idx: number) => (
                          <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{item.user_name}</p>
                              <p className="text-xs text-gray-500 mt-0.5">NIP: {item.user_nip}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-emerald-600">{formatCurrency(item.amount)}</p>
                              <p className="text-[10px] text-gray-400">{formatDate(item.date)}</p>
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

      {/* Members List */}
      <div className="space-y-4">
        {filteredMembers.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users size={40} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Tidak Ada Data Anggota</h3>
            <p className="text-sm text-gray-500 mt-2">
              {searchTerm ? 'Tidak ditemukan anggota yang sesuai.' : 'Belum ada anggota yang terdaftar.'}
            </p>
          </div>
        ) : (
          filteredMembers.map((member) => {
            const isExpanded = expandedMembers.has(member.id);
            const memberSavingsTotal = getMemberTotal(member);
            const memberLoanTotal = getMemberLoanTotal(member);
            const hasLoanDeduction = member.has_active_loan && processLoanInstallments && !member.loan_already_processed && memberLoanTotal > 0;
            const memberTotalWithLoan = memberSavingsTotal + (hasLoanDeduction ? memberLoanTotal : 0);
            const memberLoans = getMemberLoansList(member);
            const loanCount = memberLoans.length;
            
            return (
              <div key={member.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                {/* Member Header */}
                <div 
                  className="p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleMemberExpand(member.id)}
                >
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-imigrasi-primary to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-gray-900">{member.name}</h4>
                          {member.already_processed_savings && (
                            <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle2 size={10} /> Sudah Diproses
                            </span>
                          )}
                          {member.has_active_loan && (
                            <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <HandCoins size={10} /> {loanCount > 1 ? `${loanCount} Pinjaman Aktif` : 'Pinjaman Aktif'}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-4 mt-1.5 text-xs text-gray-500">
                          <span>🆔 NIP: {member.nip}</span>
                          <span>🏢 Unit: {member.unit}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Total Potongan Bulan Ini</div>
                      <div className="text-xl font-bold text-emerald-600">{formatCurrency(memberTotalWithLoan)}</div>
                      {memberLoanTotal > 0 && (
                        <div className="text-[10px] text-amber-600">
                          Angsuran: {formatCurrency(memberLoanTotal)}
                        </div>
                      )}
                    </div>
                    <div className="text-gray-400">
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>
                </div>
                
                {/* Expanded Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-gray-100"
                    >
                      <div className="p-5 bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                          {member.savings.map((saving) => {
                            if (!saving.is_applicable) return null;
                            
                            const isDisabled = saving.is_processed;
                            const currentAmount = editedAmounts[member.id]?.[saving.type_id] ?? 0;
                            
                            return (
                              <div key={saving.type_id} className="bg-white rounded-xl p-4 border border-gray-200">
                                <div className="flex justify-between items-start mb-3">
                                  <label className="text-sm font-semibold text-gray-700">
                                    Simpanan {saving.type_name}
                                  </label>
                                  {saving.is_processed && (
                                    <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                      ✓ Sudah Diproses
                                    </span>
                                  )}
                                </div>
                                
                                <div className="relative mb-3">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Rp</span>
                                  <input
                                    type="number"
                                    value={currentAmount}
                                    onChange={(e) => handleAmountChange(member.id, saving.type_id, e.target.value)}
                                    disabled={isDisabled}
                                    className={`w-full pl-10 pr-3 py-2.5 bg-gray-50 border rounded-lg outline-none transition-all ${
                                      isDisabled 
                                        ? 'border-gray-200 opacity-60 cursor-not-allowed' 
                                        : 'border-gray-300 focus:border-imigrasi-primary'
                                    }`}
                                    placeholder="0"
                                  />
                                </div>
                                
                                <div className="flex justify-between text-xs">
                                  <span className="text-gray-500">Saldo saat ini:</span>
                                  <span className="font-medium">{formatCurrency(saving.current_balance)}</span>
                                </div>
                                
                                {saving.type_name === 'Pokok' && saving.remaining_to_pay > 0 && (
                                  <div className="mt-2 text-[10px] text-orange-500">
                                    Sisa yang harus dibayar: {formatCurrency(saving.remaining_to_pay)}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          
                          {/* Loan Deduction Card - Tampilkan semua pinjaman aktif */}
                          {member.has_active_loan && memberLoans.length > 0 && (
                            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                              <div className="flex items-center gap-2 mb-3">
                                <HandCoins size={18} className="text-amber-600" />
                                <label className="text-sm font-semibold text-gray-700">
                                  Angsuran Pinjaman {memberLoans.length > 1 ? `(${memberLoans.length} pinjaman)` : ''}
                                </label>
                              </div>
                              
                              <div className="space-y-3">
                                {memberLoans.map((loan, idx) => {
                                  const paidCount = loan.installments_paid || 0;
                                  const remainingInstallments = loan.tenor_months - paidCount;
                                  return (
                                    <div key={loan.id} className="border-b border-amber-100 pb-2 last:border-0">
                                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                                        <span>Pinjaman #{idx + 1}</span>
                                        <span>Angsuran ke-{paidCount + 1} / {loan.tenor_months}</span>
                                      </div>
                                      <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Angsuran per bulan:</span>
                                        <span className="font-bold text-amber-700">{formatCurrencyDecimal(loan.monthly_installment)}</span>
                                      </div>
                                      <div className="flex justify-between text-xs mt-1">
                                        <span className="text-gray-500">Sisa pinjaman:</span>
                                        <span className="font-medium">{formatCurrencyDecimal(loan.remaining_balance)}</span>
                                      </div>
                                      {remainingInstallments > 0 && (
                                        <div className="text-[10px] text-gray-400 mt-1">
                                          Sisa {remainingInstallments} bulan lagi
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                                
                                {!member.loan_already_processed && processLoanInstallments && memberLoanTotal > 0 && (
                                  <div className="mt-3 pt-2 border-t border-amber-200">
                                    <div className="flex justify-between text-emerald-600 font-semibold">
                                      <span>Total akan dipotong:</span>
                                      <span>{formatCurrencyDecimal(memberLoanTotal)}</span>
                                    </div>
                                  </div>
                                )}
                                
                                {member.loan_already_processed && (
                                  <div className="mt-2 text-xs text-green-600 bg-green-50 p-2 rounded-lg">
                                    ✓ Angsuran bulan ini sudah diproses
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>
    </motion.div>
  );
};

export default PayrollDeduction;