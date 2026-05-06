// src/pages/member/Loans.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  HandCoins, TrendingUp, Calendar, RefreshCw, CheckCircle2, 
  Clock, AlertCircle, X, Eye, Upload, FileText, Calculator, 
  Wallet, Info, Loader2, Download, AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import api from '../../services/api';

interface Loan {
  id: number;
  user_id: number;
  amount: number;
  interest_rate: number;
  tenor_months: number;
  monthly_installment: number;
  remaining_balance: number;
  status: string;
  purpose: string | null;
  created_at: string;
}

interface Installment {
  id: number;
  loan_id: number;
  installment_number: number;
  amount_paid: number;
  payment_date: string;
  payment_method: string;
  notes: string | null;
}

interface LoanSettings {
  max_tenor_months: number;
  default_interest_rate: number;
  min_loan_amount: number;
  max_loan_amount: number;
}

const Loans: React.FC = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [isLoading, setIsLoading] = useState(false);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  
  const [loanAmount, setLoanAmount] = useState<string>('');
  const [loanTenor, setLoanTenor] = useState<string>('');
  const [loanPurpose, setLoanPurpose] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [agreementDownloaded, setAgreementDownloaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [amountError, setAmountError] = useState<string>('');
  
  // Loan Settings State - Default values yang akan di-update dari API
  const [loanSettings, setLoanSettings] = useState<LoanSettings>({
    max_tenor_months: 10,
    default_interest_rate: 1,
    min_loan_amount: 100000,
    max_loan_amount: 10000000
  });
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  
  const [simulation, setSimulation] = useState({
    monthlyInstallment: 0,
    totalPayment: 0,
    totalInterest: 0
  });

  const [activeLoanInfo, setActiveLoanInfo] = useState<{
    hasActiveLoan: boolean;
    paidPercentage: number;
    remainingAmount: number;
    canTopUp: boolean;
    message: string;
  }>({
    hasActiveLoan: false,
    paidPercentage: 0,
    remainingAmount: 0,
    canTopUp: true,
    message: ''
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
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Fetch loan settings from API
  const fetchLoanSettings = useCallback(async () => {
    try {
      const response = await api.get('/loan-settings');
      console.log('Loan settings API response:', response.data);
      if (response.data.success) {
        console.log('Setting data:', response.data.data);
        setLoanSettings(response.data.data);
        setLoanTenor(response.data.data.max_tenor_months.toString());
        setSettingsLoaded(true);
      } else {
        setSettingsLoaded(true);
      }
    } catch (error) {
      console.error('Failed to fetch loan settings:', error);
      // Coba ambil dari localStorage
      const saved = localStorage.getItem('loan_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('Using saved settings:', parsed);
        setLoanSettings(parsed);
        setLoanTenor(parsed.max_tenor_months.toString());
      }
      setSettingsLoaded(true);
    }
  }, []);

  const calculateActiveLoanInfo = useCallback((loansData: Loan[]) => {
    const activeLoan = loansData.find(l => l.status === 'active');
    
    if (!activeLoan) {
      setActiveLoanInfo({
        hasActiveLoan: false,
        paidPercentage: 0,
        remainingAmount: 0,
        canTopUp: true,
        message: ''
      });
      return;
    }

    const totalInterest = (activeLoan.amount * activeLoan.interest_rate * activeLoan.tenor_months) / 100;
    const totalLoanWithInterest = activeLoan.amount + totalInterest;
    const paidAmount = totalLoanWithInterest - activeLoan.remaining_balance;
    const paidPercentage = (paidAmount / totalLoanWithInterest) * 100;
    const canTopUp = paidPercentage >= 80;

    let message = '';
    if (!canTopUp) {
      message = `Pinjaman aktif Anda baru ${Math.round(paidPercentage)}% lunas. Minimal 80% untuk dapat mengajukan pinjaman baru.`;
    } else {
      message = `Anda dapat mengajukan pinjaman baru (top up) maksimal ${formatCurrency(loanSettings.max_loan_amount)}.`;
    }

    setActiveLoanInfo({
      hasActiveLoan: true,
      paidPercentage: Math.round(paidPercentage),
      remainingAmount: activeLoan.remaining_balance,
      canTopUp,
      message
    });
  }, [loanSettings.max_loan_amount]);

  // Perhitungan bunga: (Pokok × Bunga per bulan × Tenor) / 100
  const calculateSimulation = useCallback((amount: number, tenor: number) => {
    if (amount <= 0 || tenor <= 0) {
      setSimulation({ monthlyInstallment: 0, totalPayment: 0, totalInterest: 0 });
      return;
    }
    
    const totalInterest = (amount * loanSettings.default_interest_rate * tenor) / 100;
    const totalPayment = amount + totalInterest;
    const monthlyInstallment = Math.ceil(totalPayment / tenor);
    
    setSimulation({
      monthlyInstallment,
      totalPayment,
      totalInterest
    });
  }, [loanSettings.default_interest_rate]);

  // Validasi jumlah pinjaman
  const validateAmount = useCallback((amount: number): string => {
    if (isNaN(amount) || amount <= 0) {
      return '';
    }
    if (amount < loanSettings.min_loan_amount) {
      return `Minimal pinjaman adalah ${formatCurrency(loanSettings.min_loan_amount)}`;
    }
    if (amount > loanSettings.max_loan_amount) {
      return `Maksimal pinjaman adalah ${formatCurrency(loanSettings.max_loan_amount)}`;
    }
    if (activeLoanInfo.hasActiveLoan) {
      const existingLoanAmount = loans.find(l => l.status === 'active')?.amount || 0;
      if (existingLoanAmount + amount > loanSettings.max_loan_amount) {
        return `Total pinjaman (aktif + baru) melebihi batas maksimal ${formatCurrency(loanSettings.max_loan_amount)}`;
      }
    }
    return '';
  }, [loanSettings, activeLoanInfo.hasActiveLoan, loans, formatCurrency]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLoanAmount(value);
    const numValue = parseInt(value);
    const error = validateAmount(numValue);
    setAmountError(error);
  };

  useEffect(() => {
    if (settingsLoaded) {
      const amount = parseInt(loanAmount) || 0;
      const tenor = parseInt(loanTenor) || loanSettings.max_tenor_months;
      calculateSimulation(amount, tenor);
    }
  }, [loanAmount, loanTenor, calculateSimulation, loanSettings.max_tenor_months, settingsLoaded]);

  const fetchLoans = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/loans');
      if (response.data.success) {
        const loansData = response.data.data.data || response.data.data || [];
        setLoans(loansData);
        calculateActiveLoanInfo(loansData);
      }
    } catch (error) {
      console.error('Failed to fetch loans:', error);
    } finally {
      setIsLoading(false);
    }
  }, [calculateActiveLoanInfo]);

  const fetchInstallments = async (loanId: number) => {
    try {
      const response = await api.get(`/loans/${loanId}/installments`);
      setInstallments(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch installments:', error);
      setInstallments([]);
    }
  };

  useEffect(() => {
    fetchLoanSettings();
  }, [fetchLoanSettings]);

  useEffect(() => {
    if (settingsLoaded) {
      fetchLoans();
    }
  }, [fetchLoans, settingsLoaded]);

  const handleViewSchedule = async (loan: Loan) => {
    setSelectedLoan(loan);
    await fetchInstallments(loan.id);
    setShowScheduleModal(true);
  };

  // Generate tenor options dari 3 sampai max_tenor_months
  const getTenorOptions = useCallback(() => {
    const options = [];
    const maxTenor = loanSettings.max_tenor_months;
    for (let i = 3; i <= maxTenor; i++) {
      options.push(i);
    }
    return options;
  }, [loanSettings.max_tenor_months]);

  const handleTenorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLoanTenor(e.target.value);
  };

  const validateLoanAmount = (amount: number): { valid: boolean; message: string } => {
    if (isNaN(amount) || amount <= 0) {
      return { valid: false, message: 'Silakan isi jumlah pinjaman' };
    }
    if (amount < loanSettings.min_loan_amount) {
      return { valid: false, message: `Minimal pinjaman adalah ${formatCurrency(loanSettings.min_loan_amount)}` };
    }
    if (amount > loanSettings.max_loan_amount) {
      return { valid: false, message: `Maksimal pinjaman adalah ${formatCurrency(loanSettings.max_loan_amount)}` };
    }
    
    if (activeLoanInfo.hasActiveLoan) {
      const existingLoanAmount = loans.find(l => l.status === 'active')?.amount || 0;
      if (existingLoanAmount + amount > loanSettings.max_loan_amount) {
        return { 
          valid: false, 
          message: `Total pinjaman (aktif + baru) melebihi batas maksimal ${formatCurrency(loanSettings.max_loan_amount)}` 
        };
      }
    }
    
    return { valid: true, message: '' };
  };

  const handleDownloadDraftAgreement = async () => {
    const amount = parseInt(loanAmount);
    
    if (!amount || amount <= 0) {
      addNotification({
        title: 'Validasi Gagal',
        message: 'Silakan isi jumlah pinjaman terlebih dahulu',
        type: 'error'
      });
      return;
    }

    const validation = validateLoanAmount(amount);
    if (!validation.valid) {
      addNotification({
        title: 'Validasi Gagal',
        message: validation.message,
        type: 'error'
      });
      return;
    }

    const tenor = parseInt(loanTenor);
    if (tenor > loanSettings.max_tenor_months) {
      addNotification({
        title: 'Validasi Gagal',
        message: `Tenor maksimal adalah ${loanSettings.max_tenor_months} bulan`,
        type: 'error'
      });
      return;
    }

    if (!activeLoanInfo.canTopUp && activeLoanInfo.hasActiveLoan) {
      addNotification({
        title: 'Tidak Dapat Mengajukan Pinjaman',
        message: activeLoanInfo.message,
        type: 'error'
      });
      return;
    }

    setIsDownloading(true);
    try {
      const response = await api.post('/loans/generate-draft', {
        amount: amount,
        tenor_months: tenor,
        interest_rate: loanSettings.default_interest_rate,
        purpose: loanPurpose || 'Pinjaman anggota',
        user_name: user?.name,
        user_nip: user?.nip,
        user_unit: user?.unit
      }, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `draft_perjanjian_pinjaman_${amount}_${loanTenor}bulan.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setAgreementDownloaded(true);
      addNotification({
        title: 'Draft Berhasil Diunduh',
        message: 'Silakan cetak, isi, tanda tangani di atas materai Rp 10.000, lalu upload dokumennya.',
        type: 'success'
      });
    } catch (error: any) {
      console.error('Failed to download draft:', error);
      addNotification({
        title: 'Gagal',
        message: error.response?.data?.message || 'Gagal mengunduh draft perjanjian',
        type: 'error'
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      addNotification({
        title: 'Format Tidak Valid',
        message: 'Hanya file PDF, JPG, atau PNG yang diperbolehkan',
        type: 'error'
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      addNotification({
        title: 'Ukuran Terlalu Besar',
        message: 'Ukuran file maksimal 5MB',
        type: 'error'
      });
      return;
    }

    setUploadedFile(file);
  };

  const handleSubmitApplication = async () => {
    const amount = parseInt(loanAmount);
    
    if (!amount || amount <= 0) {
      addNotification({
        title: 'Validasi Gagal',
        message: 'Silakan isi jumlah pinjaman',
        type: 'error'
      });
      return;
    }

    const validation = validateLoanAmount(amount);
    if (!validation.valid) {
      addNotification({
        title: 'Validasi Gagal',
        message: validation.message,
        type: 'error'
      });
      return;
    }

    const tenor = parseInt(loanTenor);
    if (tenor > loanSettings.max_tenor_months) {
      addNotification({
        title: 'Validasi Gagal',
        message: `Tenor maksimal adalah ${loanSettings.max_tenor_months} bulan`,
        type: 'error'
      });
      return;
    }

    if (!agreementDownloaded) {
      addNotification({
        title: 'Validasi Gagal',
        message: 'Silakan download draft perjanjian terlebih dahulu',
        type: 'error'
      });
      return;
    }

    if (!uploadedFile) {
      addNotification({
        title: 'Validasi Gagal',
        message: 'Silakan upload dokumen perjanjian yang sudah ditandatangani',
        type: 'error'
      });
      return;
    }

    setIsProcessing(true);
    const formData = new FormData();
    formData.append('amount', amount.toString());
    formData.append('tenor_months', tenor.toString());
    formData.append('interest_rate', loanSettings.default_interest_rate.toString());
    formData.append('purpose', loanPurpose || 'Pinjaman anggota');
    formData.append('document', uploadedFile);

    try {
      const response = await api.post('/loans/submit-with-document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        addNotification({
          title: 'Pengajuan Berhasil!',
          message: 'Pengajuan pinjaman Anda telah dikirim dan menunggu verifikasi bendahara.',
          type: 'success'
        });

        setShowApplyModal(false);
        resetForm();
        await fetchLoans();
      }
    } catch (error: any) {
      console.error('Failed to submit application:', error);
      addNotification({
        title: 'Pengajuan Gagal',
        message: error.response?.data?.message || 'Terjadi kesalahan saat mengirim pengajuan',
        type: 'error'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setLoanAmount('');
    setLoanTenor(loanSettings.max_tenor_months.toString());
    setLoanPurpose('');
    setUploadedFile(null);
    setAgreementDownloaded(false);
    setAmountError('');
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      pending_treasurer: { label: 'Menunggu Bendahara', className: 'bg-amber-100 text-amber-700' },
      pending_chairman: { label: 'Menunggu Ketua', className: 'bg-blue-100 text-blue-700' },
      approved: { label: 'Disetujui', className: 'bg-green-100 text-green-700' },
      rejected: { label: 'Ditolak', className: 'bg-red-100 text-red-700' },
      active: { label: 'Aktif', className: 'bg-emerald-100 text-emerald-700' },
      completed: { label: 'Lunas', className: 'bg-gray-100 text-gray-700' }
    };
    const s = statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-700' };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.className}`}>{s.label}</span>;
  };

  const activeLoan = loans.find(l => l.status === 'active');
  const pendingLoans = loans.filter(l => l.status === 'pending_treasurer' || l.status === 'pending_chairman');
  const completedLoans = loans.filter(l => l.status === 'completed');
  
  const canApplyForNewLoan = () => {
    if (!activeLoanInfo.hasActiveLoan) return true;
    return activeLoanInfo.canTopUp;
  };

  if (!settingsLoaded) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-imigrasi-primary mx-auto mb-4" />
          <p className="text-gray-500">Memuat pengaturan pinjaman...</p>
        </div>
      </div>
    );
  }

  if (isLoading && loans.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-imigrasi-primary mx-auto mb-4" />
          <p className="text-gray-500">Memuat data pinjaman...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      {/* Apply Loan Modal */}
      <AnimatePresence>
        {showApplyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => {
                setShowApplyModal(false);
                resetForm();
              }}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 z-10 p-5 border-b border-gray-100 dark:border-neutral-700 bg-gradient-to-r from-imigrasi-primary to-blue-800 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HandCoins size={22} />
                    <h3 className="font-bold text-xl">Ajukan Pinjaman Baru</h3>
                  </div>
                  <button onClick={() => { setShowApplyModal(false); resetForm(); }} className="p-2 hover:bg-white/10 rounded-full">
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Step Indicator */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-gray-200 dark:bg-neutral-700 text-gray-500">1</div>
                    <span className="text-sm">Isi Data</span>
                  </div>
                  <div className="flex-1 h-0.5 bg-gray-200 mx-2"></div>
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${agreementDownloaded ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-neutral-700 text-gray-500'}`}>2</div>
                    <span className="text-sm">Download & Tanda Tangan</span>
                  </div>
                  <div className="flex-1 h-0.5 bg-gray-200 mx-2"></div>
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${uploadedFile ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-neutral-700 text-gray-500'}`}>3</div>
                    <span className="text-sm">Upload & Kirim</span>
                  </div>
                </div>

                {/* Active Loan Info for Top Up */}
                {activeLoanInfo.hasActiveLoan && !activeLoanInfo.canTopUp && (
                  <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20">
                    <div className="flex items-start gap-3">
                      <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                          ⚠️ Belum Dapat Mengajukan Pinjaman Baru
                        </p>
                        <p className="text-xs mt-1 text-gray-600 dark:text-gray-400">
                          {activeLoanInfo.message}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 1: Form Data */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Wallet size={16} className="text-imigrasi-primary" />
                      Jumlah Pinjaman (IDR)
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">Rp</span>
                      <input
                        type="number"
                        value={loanAmount}
                        onChange={handleAmountChange}
                        disabled={agreementDownloaded || (activeLoanInfo.hasActiveLoan && !activeLoanInfo.canTopUp)}
                        placeholder={`Min ${formatCurrency(loanSettings.min_loan_amount)} - Max ${formatCurrency(loanSettings.max_loan_amount)}`}
                        className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl outline-none disabled:opacity-50 bg-gray-50 dark:bg-neutral-700 ${
                          amountError ? 'border-red-500 focus:border-red-500' : 'border-transparent focus:border-imigrasi-accent'
                        }`}
                      />
                    </div>
                    {amountError && (
                      <p className="text-xs text-red-500 mt-1">{amountError}</p>
                    )}
                    <p className="text-xs text-gray-400">
                      Minimal: {formatCurrency(loanSettings.min_loan_amount)} • Maksimal: {formatCurrency(loanSettings.max_loan_amount)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Calendar size={16} className="text-imigrasi-primary" />
                      Tenor (Bulan)
                    </label>
                    <select 
                      value={loanTenor}
                      onChange={handleTenorChange}
                      disabled={agreementDownloaded || (activeLoanInfo.hasActiveLoan && !activeLoanInfo.canTopUp)}
                      className="w-full p-3 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-xl outline-none disabled:opacity-50"
                    >
                      {getTenorOptions().map(tenor => (
                        <option key={tenor} value={tenor}>{tenor} Bulan</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-400">
                      Maksimal tenor: {loanSettings.max_tenor_months} bulan
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <FileText size={16} className="text-imigrasi-primary" />
                      Tujuan Pinjaman (Opsional)
                    </label>
                    <input 
                      type="text" 
                      value={loanPurpose}
                      onChange={(e) => setLoanPurpose(e.target.value)}
                      disabled={agreementDownloaded || (activeLoanInfo.hasActiveLoan && !activeLoanInfo.canTopUp)}
                      placeholder="Contoh: Modal usaha, Pendidikan, Kesehatan"
                      className="w-full p-3 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-xl outline-none disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Simulation Result */}
                {loanAmount && parseInt(loanAmount) > 0 && !agreementDownloaded && !amountError && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                    <h4 className="font-bold text-blue-900 dark:text-blue-400 text-sm mb-3 flex items-center gap-2">
                      <Calculator size={16} />
                      Simulasi Angsuran ({loanTenor} Bulan)
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-blue-700 dark:text-blue-300">Pinjaman Pokok</span>
                        <span className="font-bold">{formatCurrency(parseInt(loanAmount))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700 dark:text-blue-300">Bunga ({loanSettings.default_interest_rate}% × {loanTenor} bulan)</span>
                        <span className="font-bold">{formatCurrency(simulation.totalInterest)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700 dark:text-blue-300">Total yang Dibayar</span>
                        <span className="font-bold">{formatCurrency(simulation.totalPayment)}</span>
                      </div>
                      <div className="border-t border-blue-200 pt-2 mt-2">
                        <div className="flex justify-between">
                          <span className="font-bold text-blue-900 dark:text-blue-400">Angsuran per Bulan</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 text-lg">
                            {formatCurrency(simulation.monthlyInstallment)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: Download Draft */}
                {!agreementDownloaded ? (
                  <button
                    onClick={handleDownloadDraftAgreement}
                    disabled={isDownloading || !loanAmount || parseInt(loanAmount) <= 0 || !!amountError || (activeLoanInfo.hasActiveLoan && !activeLoanInfo.canTopUp)}
                    className="w-full py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isDownloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                    {isDownloading ? 'Mengunduh...' : 'Download Draft Perjanjian'}
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                      <h4 className="font-bold text-green-800 dark:text-green-400 text-sm mb-2 flex items-center gap-2">
                        <Upload size={16} />
                        Upload Dokumen yang Sudah Ditandatangani
                      </h4>
                      <p className="text-xs text-green-700 dark:text-green-500 mb-3">
                        Upload hasil scan/foto dokumen yang sudah diisi, ditandatangani, dan ditempeli materai Rp 10.000
                      </p>
                      
                      <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                        uploadedFile 
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/10' 
                          : 'border-gray-300 dark:border-neutral-600 hover:border-imigrasi-primary'
                      }`}>
                        <input 
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={handleFileUpload}
                          className="hidden"
                          id="signed-document-upload"
                        />
                        
                        {!uploadedFile ? (
                          <>
                            <Upload size={40} className="mx-auto text-gray-400 mb-3" />
                            <p className="text-sm text-gray-500 mb-2">Belum ada file yang dipilih</p>
                            <label 
                              htmlFor="signed-document-upload"
                              className="inline-block px-5 py-2 bg-imigrasi-primary text-white rounded-lg text-sm font-semibold cursor-pointer hover:bg-blue-900 transition-colors"
                            >
                              Pilih File
                            </label>
                            <p className="text-xs text-gray-400 mt-3">Format: PDF, JPG, PNG (Max 5MB)</p>
                          </>
                        ) : (
                          <div>
                            <div className="flex items-center justify-center mb-3">
                              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                <FileText size={32} className="text-green-600" />
                              </div>
                            </div>
                            <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                              {uploadedFile.name}
                            </p>
                            <p className="text-xs text-gray-500 mb-3">
                              {(uploadedFile.size / 1024).toFixed(2)} KB
                            </p>
                            <div className="flex items-center justify-center gap-3">
                              <label 
                                htmlFor="signed-document-upload"
                                className="inline-block px-4 py-1.5 bg-gray-200 dark:bg-neutral-700 text-gray-700 rounded-lg text-xs font-semibold cursor-pointer hover:bg-gray-300 transition-colors"
                              >
                                Ganti File
                              </label>
                              <button
                                onClick={() => setUploadedFile(null)}
                                className="px-4 py-1.5 bg-red-100 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-200 transition-colors"
                              >
                                Hapus
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={handleSubmitApplication}
                      disabled={isProcessing || !uploadedFile}
                      className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                      {isProcessing ? 'Memproses...' : 'Kirim Pengajuan'}
                    </button>
                    
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-xs text-blue-700 dark:text-blue-400 flex items-start gap-2">
                        <Info size={14} className="shrink-0 mt-0.5" />
                        <span>Pastikan dokumen yang diupload sudah jelas terbaca dan materai terlihat dengan baik.</span>
                      </p>
                    </div>
                  </div>
                )}

                <div className="p-3 bg-gray-50 dark:bg-neutral-700/30 rounded-lg">
                  <p className="text-xs text-gray-500 flex items-start gap-2">
                    <Info size={14} className="shrink-0 mt-0.5" />
                    <span>Setelah mengirim pengajuan, dokumen akan diverifikasi oleh Bendahara dan Ketua Koperasi. Proses ini memerlukan waktu 1-2 hari kerja.</span>
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Schedule Modal */}
      <AnimatePresence>
        {showScheduleModal && selectedLoan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowScheduleModal(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="sticky top-0 z-10 p-5 border-b border-gray-100 dark:border-neutral-700 bg-gradient-to-r from-imigrasi-primary to-blue-800 text-white">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xl flex items-center gap-2">
                    <Calendar size={20} />
                    Jadwal Angsuran Pinjaman
                  </h3>
                  <button onClick={() => setShowScheduleModal(false)} className="p-2 hover:bg-white/10 rounded-full">
                    <X size={20} />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-neutral-700/30 rounded-xl">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Pinjaman</p>
                    <p className="font-bold text-gray-900 dark:text-white text-sm">{formatCurrency(selectedLoan.amount)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Angsuran / Bulan</p>
                    <p className="font-bold text-gray-900 dark:text-white text-sm">{formatCurrency(selectedLoan.monthly_installment)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sisa Pinjaman</p>
                    <p className="font-bold text-emerald-600 text-sm">{formatCurrency(selectedLoan.remaining_balance)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</p>
                    <div>{getStatusBadge(selectedLoan.status)}</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-gray-900 dark:text-white">Riwayat Pembayaran</h4>
                  {installments.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 dark:bg-neutral-700/30 rounded-xl">
                      <Clock size={32} className="mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">Belum ada pembayaran angsuran</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {installments.map((installment) => (
                        <div key={installment.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-neutral-700/30 rounded-lg">
                          <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                              Angsuran ke-{installment.installment_number}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(installment.payment_date)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-emerald-600">
                              {formatCurrency(installment.amount_paid)}
                            </p>
                            <p className="text-[10px] text-gray-400 capitalize">
                              {installment.payment_method === 'potong_gaji' ? '💰 Potong Gaji' : 
                               installment.payment_method === 'transfer' ? '💳 Transfer' : '💵 Tunai'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pinjaman Saya</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Maksimal pinjaman {formatCurrency(loanSettings.max_loan_amount)} dengan bunga {loanSettings.default_interest_rate}% per bulan dari pokok pinjaman
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchLoans}
            disabled={isLoading}
            className="p-3 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-500 hover:text-imigrasi-primary transition-colors disabled:opacity-50"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setShowApplyModal(true)}
            disabled={!canApplyForNewLoan()}
            className="flex items-center gap-2 px-5 py-2.5 bg-imigrasi-primary text-white rounded-xl text-sm font-bold hover:bg-blue-900 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <HandCoins size={18} />
            Ajukan Pinjaman
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-imigrasi-primary to-blue-800 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs opacity-80">Pinjaman Aktif</p>
              <p className="text-lg font-bold">{activeLoan ? formatCurrency(activeLoan.remaining_balance) : 'Rp 0'}</p>
            </div>
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-imigrasi-primary to-blue-700 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs opacity-80">Pengajuan Menunggu</p>
              <p className="text-lg font-bold">{pendingLoans.length}</p>
            </div>
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Clock size={20} />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-imigrasi-primary to-blue-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs opacity-80">Pinjaman Lunas</p>
              <p className="text-lg font-bold">{completedLoans.length}</p>
            </div>
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <CheckCircle2 size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Pending Loan Card */}
      {pendingLoans.length > 0 && (
        <div className="p-6 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-white relative overflow-hidden shadow-lg">
          <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock size={20} />
                <span className="font-bold">Pengajuan Sedang Diproses</span>
              </div>
              <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                {pendingLoans.length} pengajuan
              </span>
            </div>
            <p className="text-sm opacity-90">
              Pengajuan pinjaman Anda sedang diverifikasi oleh Bendahara dan Ketua Koperasi.
            </p>
            <p className="text-xs mt-2 opacity-70">
              Status akan berubah menjadi "Aktif" setelah pinjaman dicairkan.
            </p>
          </div>
        </div>
      )}

      {/* Info Card for Active Loan Top Up Status */}
      {activeLoanInfo.hasActiveLoan && !activeLoanInfo.canTopUp && (
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 flex items-start gap-3">
          <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">Informasi Top Up Pinjaman</p>
            <p className="text-xs text-amber-700 dark:text-amber-500 mt-1">
              {activeLoanInfo.message} Setelah mencapai 80%, Anda dapat mengajukan pinjaman baru (top up) 
              dengan total pinjaman tidak melebihi {formatCurrency(loanSettings.max_loan_amount)}.
            </p>
          </div>
        </div>
      )}

      {/* Active Loan Card */}
      {activeLoan ? (
        <div className="p-6 rounded-xl bg-gradient-to-br from-imigrasi-primary to-blue-900 text-white relative overflow-hidden shadow-lg">
          <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                {getStatusBadge(activeLoan.status)}
                <span className="text-xs text-white/60 font-mono">ID: {activeLoan.id}</span>
              </div>
              <button 
                onClick={() => handleViewSchedule(activeLoan)}
                className="px-3 py-1.5 bg-white/10 text-white rounded-lg text-xs font-bold hover:bg-white/20 transition-colors"
              >
                Lihat Jadwal Angsuran
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div> 
                <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">Sisa Pinjaman</p>
                <h2 className="text-2xl md:text-3xl font-black">{formatCurrency(activeLoan.remaining_balance)}</h2>
              </div>
              <div>
                <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">Total Pinjaman</p>
                <p className="text-lg font-bold">{formatCurrency(activeLoan.amount)}</p>
              </div>
              <div>
                <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">Angsuran / Bulan</p>
                <p className="text-lg font-bold">{formatCurrency(activeLoan.monthly_installment)}</p>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-white/20">
              <div className="flex justify-between text-xs text-white/70 mb-1">
                <span>Progress Pelunasan untuk Top Up</span>
                <span>{activeLoanInfo.paidPercentage}%</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all ${activeLoanInfo.paidPercentage >= 80 ? 'bg-green-400' : 'bg-amber-400'}`}
                  style={{ width: `${Math.min(activeLoanInfo.paidPercentage, 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-white/50 mt-1">
                Minimal 80% untuk dapat mengajukan pinjaman baru (top up)
              </p>
            </div>
          </div>
        </div>
      ) : (
        pendingLoans.length === 0 && (
          <div className="p-10 rounded-xl text-center space-y-4 bg-white dark:bg-neutral-800 shadow-lg">
            <div className="w-20 h-20 bg-gray-100 dark:bg-neutral-700 rounded-full flex items-center justify-center mx-auto">
              <HandCoins size={40} className="text-gray-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Tidak Ada Pinjaman Aktif</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Anda tidak memiliki pinjaman yang sedang berjalan saat ini.</p>
              <p className="text-xs text-gray-400 mt-1">
                Maksimal pinjaman {formatCurrency(loanSettings.max_loan_amount)} dengan bunga {loanSettings.default_interest_rate}% per bulan
              </p>
            </div>
            <button
              onClick={() => setShowApplyModal(true)}
              className="px-6 py-2.5 bg-imigrasi-primary text-white font-bold rounded-lg hover:bg-blue-900 transition-all shadow-lg"
            >
              Ajukan Pinjaman Sekarang
            </button>
          </div>
        )
      )}

      {/* Loan History Table */}
      <div className="rounded-xl overflow-hidden bg-white dark:bg-neutral-800 shadow-lg">
        <div className="p-5 border-b border-gray-100 dark:border-neutral-700">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white">Riwayat Pinjaman</h3>
        </div>
        <div className="overflow-x-auto">
          {loans.length === 0 ? (
            <div className="p-10 text-center">
              <FileText size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">Belum ada riwayat pinjaman</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-neutral-800/50">
                <tr className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                  <th className="px-5 py-3 font-bold">ID</th>
                  <th className="px-5 py-3 font-bold">Jumlah</th>
                  <th className="px-5 py-3 font-bold">Tenor</th>
                  <th className="px-5 py-3 font-bold">Angsuran/Bln</th>
                  <th className="px-5 py-3 font-bold">Tanggal</th>
                  <th className="px-5 py-3 font-bold text-center">Status</th>
                  <th className="px-5 py-3 font-bold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-neutral-700">
                {loans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-gray-50 dark:hover:bg-neutral-700/30 transition-colors">
                    <td className="px-5 py-3 text-sm font-mono text-gray-600 dark:text-gray-300">#{loan.id}</td>
                    <td className="px-5 py-3 text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(loan.amount)}</td>
                    <td className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300">{loan.tenor_months} Bln</td>
                    <td className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300">{formatCurrency(loan.monthly_installment)}</td>
                    <td className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">{formatDate(loan.created_at)}</td>
                    <td className="px-5 py-3 text-center">{getStatusBadge(loan.status)}</td>
                    <td className="px-5 py-3 text-center">
                      {(loan.status === 'active' || loan.status === 'completed') && (
                        <button 
                          onClick={() => handleViewSchedule(loan)}
                          className="p-1.5 text-imigrasi-primary hover:text-imigrasi-accent hover:bg-blue-50 rounded-lg transition-colors"
                          title="Lihat Jadwal"
                        >
                          <Eye size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Loans;