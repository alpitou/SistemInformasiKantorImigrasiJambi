import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Download,
  Search,
  Calendar,
  RefreshCw,
  FileSpreadsheet,
  ArrowUpRight,
  CheckCircle2,
  Building2,
  Banknote,
  Users,
  TrendingUp,
  Coins,
  HandCoins,
  ShieldCheck,
  Info,
  Loader2
} from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import axios from 'axios';

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
}

interface MemberData {
  id: number;
  name: string;
  nip: string;
  unit: string;
  join_date: string;
  already_processed_savings: boolean;
  has_active_loan: boolean;
  active_loans?: ActiveLoan[];
  loan_installment?: number;      // Legacy
  loan_remaining?: number;         // Legacy
  total_loan_installment?: number;
  total_loan_remaining?: number;
  loan_already_processed: boolean;
  savings: MemberSaving[];
}

interface MemberDeduction {
  id: number;
  name: string;
  nip: string;
  unit: string;
  pokok: number;
  wajib: number;
  sukarela: number;
  loan_installment: number;
  total: number;
  is_processed: boolean;
  will_be_deducted: boolean;
  loan_count?: number;
  loan_details?: {
    id: number;
    amount: number;
    monthly_installment: number;
    remaining_balance: number;
    installments_paid: number;
    tenor_months: number;
  }[];
}

interface SummaryTotals {
  total_pokok: number;
  total_wajib: number;
  total_sukarela: number;
  total_loan: number;
  total_all: number;
  member_count: number;
  will_deduct_count: number;
  loan_member_count: number;
}

const DeductionExport: React.FC = () => {
  const { addNotification } = useNotifications();
  const [searchTerm, setSearchTerm] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return now.toISOString().slice(0, 7);
  });
  const [deductions, setDeductions] = useState<MemberDeduction[]>([]);
  const [summary, setSummary] = useState<SummaryTotals>({
    total_pokok: 0,
    total_wajib: 0,
    total_sukarela: 0,
    total_loan: 0,
    total_all: 0,
    member_count: 0,
    will_deduct_count: 0,
    loan_member_count: 0
  });

  const token = localStorage.getItem('token');
  const axiosInstance = useMemo(() => {
    const instance = axios.create({
      baseURL: '/api',
      headers: { Authorization: `Bearer ${token}` },
      timeout: 30000
    });
    return instance;
  }, [token]);

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

  const getMonthName = (monthString: string) => {
    const [year, month] = monthString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  };

  // Helper untuk mendapatkan active loans dari member
  const getActiveLoansFromMember = useCallback((member: MemberData): ActiveLoan[] => {
    // Prioritaskan active_loans array jika ada
    if (member.active_loans && Array.isArray(member.active_loans) && member.active_loans.length > 0) {
      return member.active_loans;
    }
    // Fallback ke format single loan
    if (member.has_active_loan && member.loan_installment && member.loan_installment > 0) {
      return [{
        id: member.id,
        amount: 0,
        monthly_installment: member.loan_installment,
        remaining_balance: member.loan_remaining || 0,
        interest_rate: 1,
        tenor_months: 10,
        installments_paid: 0
      }];
    }
    return [];
  }, []);

  // Helper untuk mendapatkan total angsuran
  const getTotalLoanInstallment = useCallback((member: MemberData): number => {
    if (member.total_loan_installment !== undefined && member.total_loan_installment > 0) {
      return member.total_loan_installment;
    }
    const loans = getActiveLoansFromMember(member);
    return loans.reduce((sum, loan) => sum + (loan.monthly_installment || 0), 0);
  }, [getActiveLoansFromMember]);

  const fetchDeductions = useCallback(async () => {
    setIsFetching(true);
    try {
      const response = await axiosInstance.get('/savings/payroll/members', {
        params: { month: selectedMonth }
      });

      console.log('API Response:', response.data);

      if (response.data.success) {
        const members: MemberData[] = response.data.data;
        
        let totalPokok = 0;
        let totalWajib = 0;
        let totalLoan = 0;
        let loanMemberCount = 0;
        let willDeductCount = 0;

        const deductionData: MemberDeduction[] = members.map((member: MemberData) => {
          // Cari jenis simpanan Pokok dan Wajib
          const pokokSaving = member.savings?.find((s: MemberSaving) => s.type_name === 'Pokok');
          const wajibSaving = member.savings?.find((s: MemberSaving) => s.type_name === 'Wajib');
          
          let pokok = 0;
          let wajib = 0;
          let willBeDeducted = false;
          
          // Hitung potongan Pokok (hanya jika belum diproses dan belum lunas)
          if (pokokSaving && pokokSaving.is_applicable && !pokokSaving.is_processed) {
            pokok = pokokSaving.default_amount || 100000;
            if (pokokSaving.remaining_to_pay > 0 && pokokSaving.remaining_to_pay < pokok) {
              pokok = pokokSaving.remaining_to_pay;
            }
            if (pokok > 0) willBeDeducted = true;
          }
          
          // Hitung potongan Wajib (hanya jika belum diproses)
          if (wajibSaving && wajibSaving.is_applicable && !wajibSaving.is_processed) {
            wajib = parseFloat(String(wajibSaving.default_amount)) || 50000;
            if (wajib > 0) willBeDeducted = true;
          }
          
          // Dapatkan active loans
          const activeLoans = getActiveLoansFromMember(member);
          const loanInstallment = getTotalLoanInstallment(member);
          
          // Hitung jumlah anggota yang punya pinjaman (unique)
          if (activeLoans.length > 0 && loanInstallment > 0 && !member.loan_already_processed) {
            loanMemberCount++;
            if (loanInstallment > 0) willBeDeducted = true;
          }
          
          // Siapkan detail loan untuk ditampilkan
          const loanDetails = activeLoans.map(loan => ({
            id: loan.id,
            amount: loan.amount,
            monthly_installment: loan.monthly_installment,
            remaining_balance: loan.remaining_balance,
            installments_paid: loan.installments_paid || 0,
            tenor_months: loan.tenor_months
          }));
          
          const total = pokok + wajib + (member.loan_already_processed ? 0 : loanInstallment);
          
          totalPokok += pokok;
          totalWajib += wajib;
          totalLoan += (member.loan_already_processed ? 0 : loanInstallment);
          if (willBeDeducted) willDeductCount++;
          
          console.log(`Member ${member.name}: Pokok=${pokok}, Wajib=${wajib}, Loan=${loanInstallment}, Total=${total}, Akan Dipotong=${willBeDeducted}`);
          
          return {
            id: member.id,
            name: member.name,
            nip: member.nip || '-',
            unit: member.unit || '-',
            pokok: pokok,
            wajib: wajib,
            sukarela: 0,
            loan_installment: member.loan_already_processed ? 0 : loanInstallment,
            total: total,
            is_processed: member.already_processed_savings,
            will_be_deducted: willBeDeducted,
            loan_count: activeLoans.length,
            loan_details: loanDetails.length > 0 ? loanDetails : undefined
          };
        });
        
        const totalAll = totalPokok + totalWajib + totalLoan;
        
        console.log('Total members:', deductionData.length);
        console.log('Members to be deducted:', willDeductCount);
        console.log('Totals:', { totalPokok, totalWajib, totalLoan, totalAll });
        
        setDeductions(deductionData);
        setSummary({
          total_pokok: totalPokok,
          total_wajib: totalWajib,
          total_sukarela: 0,
          total_loan: totalLoan,
          total_all: totalAll,
          member_count: deductionData.length,
          will_deduct_count: willDeductCount,
          loan_member_count: loanMemberCount
        });
        
        addNotification({
          title: 'Data Dimuat',
          message: `Total ${deductionData.length} anggota, ${willDeductCount} anggota akan dipotong`,
          type: 'success'
        });
      } else {
        setDeductions([]);
        setSummary({
          total_pokok: 0,
          total_wajib: 0,
          total_sukarela: 0,
          total_loan: 0,
          total_all: 0,
          member_count: 0,
          will_deduct_count: 0,
          loan_member_count: 0
        });
      }
    } catch (error: any) {
      console.error('Error fetching deductions:', error);
      addNotification({
        title: 'Error',
        message: error.response?.data?.message || 'Gagal mengambil data potongan',
        type: 'error'
      });
      setDeductions([]);
      setSummary({
        total_pokok: 0,
        total_wajib: 0,
        total_sukarela: 0,
        total_loan: 0,
        total_all: 0,
        member_count: 0,
        will_deduct_count: 0,
        loan_member_count: 0
      });
    } finally {
      setIsFetching(false);
    }
  }, [axiosInstance, addNotification, selectedMonth, getActiveLoansFromMember, getTotalLoanInstallment]);

  useEffect(() => {
    fetchDeductions();
  }, [selectedMonth]);

  const filteredDeductions = deductions.filter(d =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.nip.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.unit.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Data untuk export (hanya yang akan dipotong)
  const exportableDeductions = deductions.filter(d => d.will_be_deducted && d.total > 0);

  const handleExport = async () => {
    if (exportableDeductions.length === 0) {
      addNotification({
        title: 'Gagal',
        message: 'Tidak ada data potongan untuk diekspor',
        type: 'error'
      });
      return;
    }
    
    setIsExporting(true);
    try {
      const monthName = getMonthName(selectedMonth);
      const transactionDate = selectedMonth.replace('-', '') + '25';

      const csvRows: string[] = [];
      csvRows.push(['REKENINGKREDIT', 'NAMA REKENING', 'REMARKS', 'JUMLAH AMOUNT', 'JUMLAH CHARGE', 'JUMLAH RECORD', 'TANGGAL', 'CABANG', 'CORPORATE/CUSTOMER', 'CORPORATE CHARGE'].join(','));
      csvRows.push([
        '9203902930293',
        'REKENING PENAMPUNGAN',
        `POTONGAN GAJI BULAN ${monthName.toUpperCase()}`,
        summary.total_all.toString(),
        '0',
        exportableDeductions.length.toString(),
        '',
        '0020',
        '',
        ''
      ].join(','));
      csvRows.push('');
      csvRows.push(['REKENINGDEBET', 'NAMA REKENING', 'REMARKS', 'AMOUNT', 'CHARGE', '', '', '', '', ''].join(','));

      exportableDeductions.forEach((item) => {
        if (item.total > 0) {
          csvRows.push([
            '182032093029',
            item.name,
            `POTONGAN BULAN ${monthName.toUpperCase()}`,
            item.total.toString(),
            '1000',
            '1',
            transactionDate,
            '0020',
            '',
            ''
          ].join(','));
        }
      });

      const blob = new Blob(["\uFEFF" + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `potongan_gaji_${selectedMonth}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      addNotification({
        title: 'Berhasil',
        message: `File untuk bulan ${monthName} berhasil diekspor (${exportableDeductions.length} anggota)`,
        type: 'success'
      });
    } catch (error: any) {
      console.error('Export error:', error);
      addNotification({
        title: 'Gagal',
        message: 'Gagal mengekspor data',
        type: 'error'
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet size={28} className="text-imigrasi-primary" />
            Ekspor Potongan Bulanan
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Export data potongan bulanan simpanan dan angsuran pinjaman
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">💰 Simpanan Pokok</span>
            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">📋 Simpanan Wajib</span>
            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">🏦 Angsuran Pinjaman</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchDeductions}
            disabled={isFetching}
            className="p-2.5 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-500 hover:text-imigrasi-primary transition-colors"
          >
            <RefreshCw size={18} className={isFetching ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || exportableDeductions.length === 0}
            className="flex items-center gap-2 px-6 py-2.5 bg-imigrasi-primary text-white rounded-xl text-sm font-semibold hover:bg-blue-800 transition-all shadow-md disabled:opacity-50"
          >
            {isExporting ? <RefreshCw size={18} className="animate-spin" /> : <Download size={18} />}
            {isExporting ? 'Mengekspor...' : 'Ekspor Format Bank'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-imigrasi-primary to-blue-700 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs opacity-80 mb-1">Total Anggota</p>
              <p className="text-2xl font-bold">{summary.member_count}</p>
              <p className="text-[10px] opacity-70 mt-1">seluruh anggota</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Users size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-imigrasi-primary to-blue-700 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs opacity-80 mb-1">Akan Dipotong</p>
              <p className="text-2xl font-bold">{summary.will_deduct_count}</p>
              <p className="text-[10px] opacity-70 mt-1">anggota</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <HandCoins size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-imigrasi-primary to-blue-700 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs opacity-80 mb-1">Simpanan Pokok</p>
              <p className="text-lg font-bold">{formatCurrency(summary.total_pokok)}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <ShieldCheck size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-imigrasi-primary to-blue-700 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs opacity-80 mb-1">Simpanan Wajib</p>
              <p className="text-lg font-bold">{formatCurrency(summary.total_wajib)}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Coins size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-imigrasi-primary to-blue-700 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs opacity-80 mb-1">Angsuran Pinjaman</p>
              <p className="text-lg font-bold">{formatCurrency(summary.total_loan)}</p>
              <p className="text-[10px] opacity-70 mt-1">{summary.loan_member_count} anggota</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <TrendingUp size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-gray-200 dark:border-neutral-700 shadow-sm">
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
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 rounded-xl focus:border-imigrasi-primary focus:ring-1 focus:ring-imigrasi-primary outline-none dark:text-white"
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
                className="w-full pl-11 pr-4 py-2.5 bg-gray-50 dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 rounded-xl focus:border-imigrasi-primary focus:ring-1 focus:ring-imigrasi-primary outline-none dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-neutral-700 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">
              Daftar Potongan - {getMonthName(selectedMonth)}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {filteredDeductions.length} anggota ditampilkan
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-full">
            <CheckCircle2 size={14} />
            {exportableDeductions.length} anggota siap ekspor
          </div>
        </div>
        
        <div className="overflow-x-auto">
          {isFetching ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 size={40} className="animate-spin text-imigrasi-primary mb-4" />
              <p className="text-gray-500">Memuat data potongan...</p>
            </div>
          ) : filteredDeductions.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 dark:bg-neutral-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileSpreadsheet size={32} className="text-gray-400" />
              </div>
              <p className="text-gray-500">Tidak ada data anggota</p>
              <p className="text-xs text-gray-400 mt-2">Coba pilih bulan lain atau refresh data</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-neutral-800/80">
                <tr className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-semibold w-12">No</th>
                  <th className="px-6 py-4 font-semibold">Anggota</th>
                  <th className="px-6 py-4 font-semibold">NIP</th>
                  <th className="px-6 py-4 font-semibold">Unit</th>
                  <th className="px-6 py-4 font-semibold text-right">Pokok</th>
                  <th className="px-6 py-4 font-semibold text-right">Wajib</th>
                  <th className="px-6 py-4 font-semibold text-right">Angsuran</th>
                  <th className="px-6 py-4 font-semibold text-right">Total</th>
                  <th className="px-6 py-4 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-neutral-700">
                {filteredDeductions.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-500">{idx + 1}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-imigrasi-primary to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                          {item.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</span>
                          {item.loan_count && item.loan_count > 1 && (
                            <div className="text-[9px] text-amber-600 mt-0.5">
                              {item.loan_count} Pinjaman Aktif
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-600 dark:text-gray-300">{item.nip}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{item.unit}</td>
                    <td className="px-6 py-4 text-sm text-right font-medium text-emerald-600 dark:text-emerald-400">
                      {item.pokok > 0 ? formatCurrency(item.pokok) : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-medium text-cyan-600 dark:text-cyan-400">
                      {item.wajib > 0 ? formatCurrency(item.wajib) : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-medium text-amber-600 dark:text-amber-400">
                      {item.loan_installment > 0 ? formatCurrencyDecimal(item.loan_installment) : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-bold text-imigrasi-primary dark:text-white">
                      {item.total > 0 ? formatCurrency(item.total) : '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {item.will_be_deducted ? (
                        <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1 justify-center">
                          <CheckCircle2 size={10} /> Akan Dipotong
                        </span>
                      ) : item.is_processed ? (
                        <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                          ✓ Sudah Diproses
                        </span>
                      ) : (
                        <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                          Tidak Ada Potongan
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 dark:bg-neutral-800/80 border-t border-gray-200 dark:border-neutral-700">
                <tr className="font-semibold">
                  <td colSpan={4} className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    TOTAL KESELURUHAN
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(summary.total_pokok)}
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-cyan-600 dark:text-cyan-400">
                    {formatCurrency(summary.total_wajib)}
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-amber-600 dark:text-amber-400">
                    {formatCurrency(summary.total_loan)}
                  </td>
                  <td className="px-6 py-4 text-sm text-right font-bold text-imigrasi-primary dark:text-white text-lg">
                    {formatCurrency(summary.total_all)}
                  </td>
                  <td className="px-6 py-4" />
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-5 border border-blue-100 dark:border-blue-800/30">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-imigrasi-primary text-white rounded-xl shadow-md">
            <Info size={24} />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-blue-900 dark:text-blue-400 text-sm mb-1">Informasi Ekspor</h4>
            <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
              File CSV dengan format standar perbankan untuk pemotongan gaji bulanan.
            </p>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                <CheckCircle2 size={14} />
                <span>Format: CSV standar perbankan</span>
              </div>
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                <Banknote size={14} />
                <span>Charge per transaksi: Rp 1.000</span>
              </div>
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                <Calendar size={14} />
                <span>Tanggal transaksi: 25 setiap bulan</span>
              </div>
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                <Building2 size={14} />
                <span>Cabang: 0020</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default DeductionExport;