import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wallet, Users, Calendar, RefreshCw, 
  CheckCircle2, Clock, Search, 
  Save, History, Download, HandCoins,
  FileSpreadsheet, Settings, Info, Coins, ShieldCheck,
  ChevronDown, ChevronUp, AlertCircle
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

interface Member {
  id: number;
  name: string;
  nip: string;
  unit: string;
  join_date: string;
  already_processed_savings: boolean;
  has_active_loan: boolean;
  loan_installment: number;
  loan_remaining: number;
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
  const [debugInfo, setDebugInfo] = useState<string>('');

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

  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get('/savings/payroll/members', {
        params: { month: selectedMonth }
      });
      
      console.log('Members response:', response.data);
      
      if (response.data.success) {
        setMembers(response.data.data);
        setFilteredMembers(response.data.data);
        
        // Initialize edited amounts with default values
        const initialEdits: Record<number, Record<number, number>> = {};
        response.data.data.forEach((member: Member) => {
          initialEdits[member.id] = {};
          member.savings.forEach(saving => {
            // Only set amount for applicable savings that are not processed
            if (saving.is_applicable && !saving.is_processed) {
              let amount = 0;
              
              if (saving.type_name === 'Pokok') {
                // For Pokok: only set remaining amount needed
                amount = Math.min(saving.default_amount, saving.remaining_to_pay);
              } else if (saving.type_name === 'Wajib') {
                // For Wajib: always set default amount
                amount = saving.default_amount;
              } else {
                amount = saving.default_amount;
              }
              
              initialEdits[member.id][saving.type_id] = amount;
              console.log(`Set initial amount for ${member.name} - ${saving.type_name}: ${amount}`);
            } else {
              initialEdits[member.id][saving.type_id] = 0;
            }
          });
        });
        setEditedAmounts(initialEdits);
        
        // Log totals for debugging
        let totalPotongan = 0;
        response.data.data.forEach((member: Member) => {
          let memberTotal = 0;
          member.savings.forEach(saving => {
            const amount = initialEdits[member.id]?.[saving.type_id] || 0;
            memberTotal += amount;
          });
          console.log(`Member ${member.name} total: ${memberTotal}`);
          totalPotongan += memberTotal;
        });
        console.log('Total initial potongan:', totalPotongan);
        setDebugInfo(`Total potongan awal: ${formatCurrency(totalPotongan)}`);
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

  // Calculate total deductions for a member
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

  const handleProcessPayroll = async () => {
    // Collect savings deductions
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
    
    // Check for loan deductions
    const membersWithLoan = filteredMembers.filter(m => 
      m.has_active_loan && 
      processLoanInstallments && 
      !m.loan_already_processed &&
      m.loan_installment > 0
    );
    
    console.log('Deductions to process:', deductions);
    console.log('Members with loan:', membersWithLoan.length);
    
    if (deductions.length === 0 && membersWithLoan.length === 0) {
      addNotification({ 
        title: 'Validasi Gagal', 
        message: 'Tidak ada potongan yang akan diproses. Silakan cek kembali data.', 
        type: 'error' 
      });
      return;
    }
    
    const totalSavingsDeduction = deductions.reduce((sum, d) => sum + d.amount, 0);
    const totalLoanDeduction = membersWithLoan.reduce((sum, m) => sum + m.loan_installment, 0);
    
    // Build confirmation message
    let confirmMessage = `⚠️ KONFIRMASI POTONGAN PAYROLL ⚠️\n\n`;
    confirmMessage += `📅 Periode: ${getMonthName(selectedMonth)}\n`;
    confirmMessage += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    if (deductions.length > 0) {
      confirmMessage += `💰 POTONGAN SIMPANAN (${deductions.length} item):\n`;
      const byType: Record<string, { count: number; total: number }> = {};
      for (const d of deductions) {
        const savingType = savingTypes.find(t => t.id === d.saving_type_id);
        const typeName = savingType?.name || 'Unknown';
        if (!byType[typeName]) {
          byType[typeName] = { count: 0, total: 0 };
        }
        byType[typeName].count++;
        byType[typeName].total += d.amount;
      }
      for (const [type, data] of Object.entries(byType)) {
        confirmMessage += `   - ${type}: ${data.count} anggota (${formatCurrency(data.total)})\n`;
      }
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
      
      console.log('Process response:', response.data);
      
      if (response.data.success) {
        addNotification({ 
          title: '✅ Berhasil', 
          message: response.data.message, 
          type: 'success' 
        });
        
        // Refresh data
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

  // Calculate all statistics
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
      
      if (member.has_active_loan && processLoanInstallments && !member.loan_already_processed && member.loan_installment > 0) {
        totalLoan += member.loan_installment;
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
      loanCount: filteredMembers.filter(m => m.has_active_loan && !m.loan_already_processed && m.loan_installment > 0).length
    };
  }, [filteredMembers, editedAmounts, processLoanInstallments]);

  const totals = calculateTotals();
  
  const stats = {
    totalMembers: filteredMembers.length,
    activeLoanMembers: filteredMembers.filter(m => m.has_active_loan).length,
    pendingLoanMembers: filteredMembers.filter(m => m.has_active_loan && !m.loan_already_processed && m.loan_installment > 0).length,
    processedMembers: filteredMembers.filter(m => m.already_processed_savings).length,
  };

  const getSavingTypeStyle = (typeName: string) => {
    const styles: Record<string, { icon: JSX.Element; color: string; bgColor: string }> = {
      'Pokok': { 
        icon: <ShieldCheck size={16} />, 
        color: 'text-emerald-600', 
        bgColor: 'bg-emerald-50 dark:bg-emerald-900/20'
      },
      'Wajib': { 
        icon: <Coins size={16} />, 
        color: 'text-blue-600', 
        bgColor: 'bg-blue-50 dark:bg-blue-900/20'
      },
      'Sukarela': { 
        icon: <Wallet size={16} />, 
        color: 'text-purple-600', 
        bgColor: 'bg-purple-50 dark:bg-purple-900/20'
      }
    };
    return styles[typeName] || { icon: <Wallet size={16} />, color: 'text-gray-600', bgColor: 'bg-gray-50' };
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">💳 Potongan Payroll Simpanan</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Kelola potongan gaji untuk simpanan pokok, wajib, dan angsuran pinjaman anggota
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <div className="bg-emerald-100 text-emerald-700 text-xs px-3 py-1.5 rounded-full flex items-center gap-1">
              <ShieldCheck size={12} /> Simpanan Pokok (Bayar sekali)
            </div>
            <div className="bg-blue-100 text-blue-700 text-xs px-3 py-1.5 rounded-full flex items-center gap-1">
              <Coins size={12} /> Simpanan Wajib (Bulanan)
            </div>
            <div className="bg-amber-100 text-amber-700 text-xs px-3 py-1.5 rounded-full flex items-center gap-1">
              <HandCoins size={12} /> Angsuran Pinjaman (Otomatis)
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
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

      {/* Debug Info */}
      {debugInfo && (
        <div className="bg-gray-100 dark:bg-neutral-800 rounded-xl p-3 text-sm text-gray-600">
          <Info size={14} className="inline mr-2" />
          {debugInfo}
        </div>
      )}

      {/* Saving Types Info Card */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-2xl p-5 border border-indigo-100 dark:border-indigo-800/30">
        <div className="flex items-center gap-2 mb-3">
          <Settings size={18} className="text-indigo-500" />
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Pengaturan Nilai Potongan dari Database:</span>
        </div>
        <div className="flex flex-wrap gap-4">
          {savingTypes.map(type => (
            <div key={type.id} className="flex items-center gap-2 bg-white dark:bg-neutral-800 px-4 py-2 rounded-xl shadow-sm border border-gray-100 dark:border-neutral-700">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{type.name}:</span>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(type.default_amount)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 text-xs text-gray-500 flex items-center gap-2">
          <Info size={14} />
          <span>Simpanan Pokok hanya dipotong sekali sampai mencapai nominal yang ditentukan</span>
        </div>
      </div>

      {/* Export Section */}
      <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-gray-200 dark:border-neutral-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 rounded-xl">
              <FileSpreadsheet size={24} className="text-emerald-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">📊 Ekspor Data Potongan</p>
              <p className="text-xs text-gray-500">Ekspor data potongan ke file CSV untuk keperluan payroll bank</p>
            </div>
          </div>
          <button 
            onClick={handleExportCSV}
            disabled={isExporting}
            className="px-6 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-600 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isExporting ? <RefreshCw size={18} className="animate-spin" /> : <Download size={18} />}
            Ekspor Data CSV
          </button>
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
            <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 border border-gray-200 dark:border-neutral-700">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <History size={20} />
                📋 Riwayat Potongan Payroll
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
                        {data.items?.slice(0, 10).map((item: PayrollHistoryItem, idx: number) => (
                          <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-neutral-700/30 rounded-xl hover:bg-gray-100 transition-colors">
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{item.user_name}</p>
                              <p className="text-xs text-gray-500 mt-0.5">NIP: {item.user_nip}</p>
                              <p className="text-xs text-gray-500">{item.saving_type}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-emerald-600">
                                {formatCurrency(item.amount)}
                              </p>
                              <p className="text-[10px] text-gray-400">
                                {formatDate(item.date)}
                              </p>
                            </div>
                          </div>
                        ))}
                        {data.items?.length > 10 && (
                          <p className="text-xs text-center text-gray-400">... dan {data.items.length - 10} lainnya</p>
                        )}
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
      <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 border border-gray-200 dark:border-neutral-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-imigrasi-primary/10 rounded-xl">
              <Calendar size={24} className="text-imigrasi-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">📅 Periode Potongan</p>
              <p className="text-xs text-gray-500">Pilih bulan dan tahun untuk potongan payroll</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2.5 bg-gray-50 dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 rounded-xl focus:border-imigrasi-primary outline-none dark:text-white"
            />
            <button 
              onClick={handleProcessPayroll}
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-600 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
              Proses Potongan
            </button>
          </div>
        </div>
        
        {/* Checkbox for loan installments */}
        <div className="mt-5 flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
          <input
            type="checkbox"
            id="processLoanInstallments"
            checked={processLoanInstallments}
            onChange={(e) => setProcessLoanInstallments(e.target.checked)}
            className="w-4 h-4 text-imigrasi-primary rounded focus:ring-imigrasi-primary"
          />
          <label htmlFor="processLoanInstallments" className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2 cursor-pointer">
            <HandCoins size={16} />
            Potong otomatis angsuran pinjaman anggota yang aktif
          </label>
        </div>
      </div>

      {/* Stats Summary - TOTAL POTONGAN */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white">
          <p className="text-xs opacity-80 mb-1">👥 Total Anggota</p>
          <p className="text-2xl font-bold">{stats.totalMembers}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-4 text-white">
          <p className="text-xs opacity-80 mb-1">💰 Potongan Simpanan</p>
          <p className="text-lg font-bold">{formatCurrency(totals.totalSavings)}</p>
          <div className="text-[10px] opacity-80 mt-1">
            Pokok: {formatCurrency(totals.pokokTotal)} • Wajib: {formatCurrency(totals.wajibTotal)}
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-4 text-white">
          <p className="text-xs opacity-80 mb-1">🏦 Potongan Angsuran</p>
          <p className="text-lg font-bold">{formatCurrency(totals.totalLoan)}</p>
          <p className="text-[10px] opacity-80 mt-1">{totals.loanCount} anggota</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 text-white">
          <p className="text-xs opacity-80 mb-1">💰 TOTAL KESELURUHAN</p>
          <p className="text-2xl font-bold">{formatCurrency(totals.totalAll)}</p>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-3 text-center border border-gray-200 dark:border-neutral-700">
          <p className="text-xs text-gray-500">🔄 Sudah Diproses</p>
          <p className="text-lg font-bold text-blue-600">{stats.processedMembers}</p>
        </div>
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-3 text-center border border-gray-200 dark:border-neutral-700">
          <p className="text-xs text-gray-500">🏦 Pinjaman Aktif</p>
          <p className="text-lg font-bold text-amber-600">{stats.activeLoanMembers}</p>
        </div>
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-3 text-center border border-gray-200 dark:border-neutral-700">
          <p className="text-xs text-gray-500">📅 Periode</p>
          <p className="text-sm font-bold text-gray-700">{getMonthName(selectedMonth)}</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Cari berdasarkan nama, NIP, atau unit kerja..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:border-imigrasi-primary outline-none transition-colors dark:text-white"
        />
      </div>

      {/* Members List */}
      <div className="space-y-4">
        {filteredMembers.length === 0 ? (
          <div className="bg-white dark:bg-neutral-800 rounded-2xl p-12 text-center border border-gray-200 dark:border-neutral-700">
            <div className="w-20 h-20 bg-gray-100 dark:bg-neutral-700 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users size={40} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Tidak Ada Data Anggota</h3>
            <p className="text-sm text-gray-500 mt-2">
              {searchTerm ? 'Tidak ditemukan anggota yang sesuai dengan pencarian.' : 'Belum ada anggota yang terdaftar.'}
            </p>
          </div>
        ) : (
          filteredMembers.map((member) => {
            const isExpanded = expandedMembers.has(member.id);
            const memberSavingsTotal = getMemberTotal(member);
            const hasLoanDeduction = member.has_active_loan && processLoanInstallments && !member.loan_already_processed && member.loan_installment > 0;
            const memberTotalWithLoan = memberSavingsTotal + (hasLoanDeduction ? member.loan_installment : 0);
            
            return (
              <div key={member.id} className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 overflow-hidden">
                {/* Member Header */}
                <div 
                  className="p-5 cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-700/50 transition-colors"
                  onClick={() => toggleMemberExpand(member.id)}
                >
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <img 
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`} 
                        alt="" 
                        className="w-14 h-14 rounded-full border-2 border-gray-200 dark:border-neutral-600" 
                      />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-gray-900 dark:text-white">{member.name}</h4>
                          {member.already_processed_savings && (
                            <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle2 size={10} /> Sudah Diproses
                            </span>
                          )}
                          {member.has_active_loan && (
                            <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <HandCoins size={10} /> Pinjaman Aktif
                            </span>
                          )}
                        </div>
                        <div className="flex gap-4 mt-1.5 text-xs text-gray-500">
                          <span>🆔 NIP: {member.nip}</span>
                          <span>🏢 Unit: {member.unit}</span>
                          <span>📅 Bergabung: {formatDate(member.join_date)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Total Potongan</div>
                      <div className="text-xl font-bold text-emerald-600">{formatCurrency(memberTotalWithLoan)}</div>
                      {memberSavingsTotal > 0 && member.loan_installment > 0 && hasLoanDeduction && (
                        <div className="text-xs text-gray-400 mt-1">
                          Simpanan: {formatCurrency(memberSavingsTotal)} + Angsuran: {formatCurrency(member.loan_installment)}
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
                      className="border-t border-gray-100 dark:border-neutral-700"
                    >
                      <div className="p-5 bg-gray-50 dark:bg-neutral-700/30">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                          {member.savings.map((saving) => {
                            if (!saving.is_applicable) return null;
                            
                            const style = getSavingTypeStyle(saving.type_name);
                            const isDisabled = saving.is_processed;
                            const currentAmount = editedAmounts[member.id]?.[saving.type_id] ?? 0;
                            
                            let statusInfo = null;
                            if (saving.type_name === 'Pokok' && saving.current_balance >= saving.default_amount) {
                              statusInfo = { text: '✓ Lunas', color: 'text-green-600' };
                            } else if (saving.is_processed) {
                              statusInfo = { text: '✓ Sudah Diproses', color: 'text-blue-600' };
                            } else if (saving.remaining_to_pay > 0 && saving.remaining_to_pay < saving.default_amount) {
                              statusInfo = { text: `Sisa: ${formatCurrency(saving.remaining_to_pay)}`, color: 'text-amber-600' };
                            }
                            
                            return (
                              <div key={saving.type_id} className={`${style.bgColor} rounded-xl p-4`}>
                                <div className="flex justify-between items-start mb-3">
                                  <div className="flex items-center gap-2">
                                    {style.icon}
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                      Simpanan {saving.type_name}
                                    </label>
                                  </div>
                                  {statusInfo && (
                                    <span className={`text-[10px] ${statusInfo.color} font-medium`}>
                                      {statusInfo.text}
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
                                    className={`w-full pl-10 pr-3 py-2.5 bg-white dark:bg-neutral-700 border rounded-lg outline-none transition-all dark:text-white ${
                                      isDisabled 
                                        ? 'border-gray-200 opacity-60 cursor-not-allowed' 
                                        : 'border-gray-300 focus:border-imigrasi-primary'
                                    }`}
                                    placeholder="0"
                                  />
                                </div>
                                
                                <div className="flex justify-between text-xs">
                                  <span className="text-gray-500">💵 Saldo saat ini:</span>
                                  <span className="font-medium text-gray-700 dark:text-gray-300">
                                    {formatCurrency(saving.current_balance)}
                                  </span>
                                </div>
                                
                                {!isDisabled && saving.default_amount > 0 && (
                                  <div className="mt-2 pt-2 border-t border-gray-200 dark:border-neutral-600">
                                    <div className="flex justify-between text-[11px]">
                                      <span className="text-gray-400">Nilai default:</span>
                                      <span className="text-emerald-600 font-medium">
                                        {formatCurrency(saving.default_amount)}
                                      </span>
                                    </div>
                                    {saving.type_name === 'Pokok' && saving.default_amount > 0 && (
                                      <div className="flex justify-between text-[11px] mt-1">
                                        <span className="text-gray-400">Target:</span>
                                        <span className="text-amber-600 font-medium">
                                          {formatCurrency(saving.default_amount)}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          
                          {/* Loan Deduction Card */}
                          {member.has_active_loan && (
                            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <HandCoins size={18} className="text-amber-600" />
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                  Angsuran Pinjaman
                                </label>
                                {member.loan_already_processed && (
                                  <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full ml-auto">
                                    ✓ Sudah Dipotong
                                  </span>
                                )}
                              </div>
                              
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-500">💰 Angsuran per bulan:</span>
                                  <span className="font-bold text-amber-700 dark:text-amber-400">
                                    {formatCurrencyDecimal(member.loan_installment)}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">📊 Sisa pinjaman:</span>
                                  <span className="font-medium text-gray-700 dark:text-gray-300">
                                    {formatCurrencyDecimal(member.loan_remaining)}
                                  </span>
                                </div>
                                {!member.loan_already_processed && processLoanInstallments && member.loan_installment > 0 && (
                                  <div className="mt-3 pt-2 border-t border-amber-200 dark:border-amber-800/30">
                                    <div className="flex justify-between text-emerald-600 font-semibold">
                                      <span>Akan dipotong:</span>
                                      <span>{formatCurrencyDecimal(member.loan_installment)}</span>
                                    </div>
                                  </div>
                                )}
                                {member.loan_already_processed && (
                                  <div className="text-xs text-green-600 mt-2 flex items-center gap-1">
                                    <CheckCircle2 size={12} />
                                    Angsuran bulan ini sudah dipotong
                                  </div>
                                )}
                                {!processLoanInstallments && !member.loan_already_processed && member.loan_installment > 0 && (
                                  <div className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                                    <AlertCircle size={12} />
                                    Potongan angsuran dinonaktifkan
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
      
      {/* Footer Info */}
      <div className="bg-gray-50 dark:bg-neutral-800/50 rounded-xl p-4 text-center text-xs text-gray-500">
        <p>💡 Informasi: Simpanan Pokok hanya dipotong sekali sampai mencapai nominal yang ditentukan. Simpanan Wajib dipotong setiap bulan. Angsuran pinjaman akan dipotong otomatis jika anggota memiliki pinjaman aktif.</p>
      </div>
    </motion.div>
  );
};

export default PayrollDeduction;