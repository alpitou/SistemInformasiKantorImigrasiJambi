// src/pages/member/Loans.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  HandCoins, TrendingUp, PieChart, ArrowUpRight, ArrowDownRight, 
  Download, Info, Calendar, RefreshCw, CheckCircle2, Clock, 
  AlertCircle, X, Eye, Upload, FileText, Calculator, Wallet,
  Building2, Percent, AlertTriangle, Loader2
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import api from '../../services/api';

interface Loan {
  id: number;
  amount: number;
  interest_rate: number;
  tenor_months: number;
  monthly_installment: number;
  remaining_balance: number;
  status: string;
  created_at: string;
  agreement_document: string | null;
  document_status: string;
  purpose?: string;
}

interface Installment {
  id: number;
  loan_id: number;
  installment_number: number;
  amount_paid: number;
  payment_date: string;
  payment_method: string;
  notes: string;
}

interface LoanSettings {
  max_tenor_months: number;
  default_interest_rate: number;
  min_loan_amount: number;
  max_loan_amount: number;
}

// Default settings
const DEFAULT_LOAN_SETTINGS: LoanSettings = {
  max_tenor_months: 10,
  default_interest_rate: 1,
  min_loan_amount: 100000,
  max_loan_amount: 50000000
};

const Loans: React.FC = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [isLoading, setIsLoading] = useState(false);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [loanStep, setLoanStep] = useState(1);
  const [loanAmount, setLoanAmount] = useState('');
  const [loanTenor, setLoanTenor] = useState('10');
  const [loanPurpose, setLoanPurpose] = useState('');
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [currentLoanId, setCurrentLoanId] = useState<number | null>(null);
  
  // Loan Settings State
  const [loanSettings, setLoanSettings] = useState<LoanSettings>(DEFAULT_LOAN_SETTINGS);
  
  // Simulation State
  const [simulation, setSimulation] = useState({
    monthlyInstallment: 0,
    totalPayment: 0,
    totalInterest: 0
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

  // Load loan settings from localStorage
  const loadLoanSettings = useCallback(() => {
    try {
      const saved = localStorage.getItem('loan_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        setLoanSettings(parsed);
        setLoanTenor(parsed.max_tenor_months.toString());
      } else {
        // Set default
        localStorage.setItem('loan_settings', JSON.stringify(DEFAULT_LOAN_SETTINGS));
        setLoanTenor(DEFAULT_LOAN_SETTINGS.max_tenor_months.toString());
      }
    } catch (e) {
      console.error('Failed to load loan settings', e);
      setLoanTenor(DEFAULT_LOAN_SETTINGS.max_tenor_months.toString());
    }
  }, []);

  // Fetch loan settings from API (fallback to localStorage)
  const fetchLoanSettings = useCallback(async () => {
    try {
      const response = await api.get('/settings/loan');
      if (response.data.success && response.data.data) {
        setLoanSettings(response.data.data);
        setLoanTenor(response.data.data.max_tenor_months.toString());
        localStorage.setItem('loan_settings', JSON.stringify(response.data.data));
      }
    } catch (error) {
      console.warn('Failed to fetch loan settings from API, using localStorage');
      loadLoanSettings();
    }
  }, [loadLoanSettings]);

  // Calculate loan simulation
  const calculateSimulation = useCallback((amount: number, tenor: number, interestRate: number) => {
    if (amount <= 0 || tenor <= 0) {
      setSimulation({ monthlyInstallment: 0, totalPayment: 0, totalInterest: 0 });
      return;
    }
    
    const totalInterestAmount = amount * interestRate / 100;
    const totalPayment = amount + totalInterestAmount;
    const monthlyInstallment = Math.ceil(totalPayment / tenor);
    
    setSimulation({
      monthlyInstallment: monthlyInstallment,
      totalPayment: totalPayment,
      totalInterest: totalInterestAmount
    });
  }, []);

  // Update simulation when loan amount or tenor changes
  useEffect(() => {
    const amount = parseInt(loanAmount) || 0;
    const tenor = parseInt(loanTenor) || loanSettings.max_tenor_months;
    calculateSimulation(amount, tenor, loanSettings.default_interest_rate);
  }, [loanAmount, loanTenor, loanSettings.default_interest_rate, loanSettings.max_tenor_months, calculateSimulation]);

  const fetchLoans = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/loans');
      if (response.data.success) {
        const loansData = response.data.data.data || response.data.data || [];
        setLoans(loansData);
      } else {
        setLoans([]);
      }
    } catch (error) {
      console.error('Failed to fetch loans:', error);
      setLoans([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchInstallments = async (loanId: number) => {
    setIsLoading(true);
    try {
      const response = await api.get(`/loans/${loanId}/installments`);
      setInstallments(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch installments:', error);
      setInstallments([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
    fetchLoanSettings();
  }, [fetchLoans, fetchLoanSettings]);

  const handleRefresh = async () => {
    await fetchLoans();
    await fetchLoanSettings();
  };

  const handleViewSchedule = async (loan: Loan) => {
    setSelectedLoan(loan);
    await fetchInstallments(loan.id);
    setShowScheduleModal(true);
  };

  const getTenorOptions = () => {
    const options = [];
    const maxTenor = loanSettings.max_tenor_months;
    for (let i = 3; i <= maxTenor; i++) {
      options.push(i);
    }
    return options;
  };

  const validateLoanAmount = (amount: number): boolean => {
    if (amount < loanSettings.min_loan_amount) {
      addNotification({
        title: 'Nominal Terlalu Kecil',
        message: `Minimal pinjaman adalah ${formatCurrency(loanSettings.min_loan_amount)}`,
        type: 'error'
      });
      return false;
    }
    if (amount > loanSettings.max_loan_amount) {
      addNotification({
        title: 'Nominal Terlalu Besar',
        message: `Maksimal pinjaman adalah ${formatCurrency(loanSettings.max_loan_amount)}`,
        type: 'error'
      });
      return false;
    }
    return true;
  };

  const handleSubmitLoan = async () => {
    if (!loanAmount || !loanTenor) {
      addNotification({
        title: 'Validasi Gagal',
        message: 'Harap isi jumlah pinjaman dan tenor',
        type: 'error'
      });
      return;
    }

    const amount = parseInt(loanAmount);
    if (!validateLoanAmount(amount)) return;

    setIsLoading(true);
    try {
      const response = await api.post('/loans', {
        amount: amount,
        tenor_months: parseInt(loanTenor),
        interest_rate: loanSettings.default_interest_rate,
        purpose: loanPurpose || 'Pinjaman anggota'
      });

      if (response.data.success) {
        const newLoan = response.data.data;
        setCurrentLoanId(newLoan.id);
        setLoanStep(2);
        addNotification({
          title: 'Pengajuan Dibuat',
          message: 'Silakan download, cetak, tanda tangani surat perjanjian, lalu upload kembali.',
          type: 'success'
        });
      }
    } catch (error: any) {
      console.error('Failed to submit loan:', error);
      addNotification({
        title: 'Gagal Mengajukan',
        message: error.response?.data?.message || 'Terjadi kesalahan saat mengajukan pinjaman',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadAgreement = async () => {
    if (!currentLoanId) return;

    setIsLoading(true);
    try {
      const response = await api.get(`/loans/${currentLoanId}/generate-agreement`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `surat_perjanjian_pinjaman_${currentLoanId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setHasDownloaded(true);
      addNotification({
        title: 'Dokumen Diunduh',
        message: 'Silakan cetak, tanda tangani di atas materai, dan unggah kembali.',
        type: 'info'
      });
    } catch (error) {
      console.error('Failed to download agreement:', error);
      addNotification({
        title: 'Gagal Mengunduh',
        message: 'Gagal mengunduh dokumen surat perjanjian',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentLoanId) return;

    if (file.type !== 'application/pdf' && !file.type.includes('image')) {
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

  const handleUploadDocument = async () => {
    if (!uploadedFile || !currentLoanId) return;

    setIsLoading(true);
    const formData = new FormData();
    formData.append('document', uploadedFile);

    try {
      const response = await api.post(`/loans/${currentLoanId}/upload-document`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        setLoanStep(3);
        addNotification({
          title: 'Dokumen Terunggah',
          message: 'Dokumen berhasil diunggah. Menunggu persetujuan Bendahara dan Ketua.',
          type: 'success'
        });

        setShowLoanModal(false);
        resetLoanForm();
        fetchLoans();
        
        // Close modal after short delay
        setTimeout(() => {
          setShowLoanModal(false);
          resetLoanForm();
          fetchLoans();
        }, 2000);
      }
    } catch (error: any) {
      console.error('Failed to upload document:', error);
      addNotification({
        title: 'Gagal Mengunggah',
        message: error.response?.data?.message || 'Gagal mengunggah dokumen',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetLoanForm = () => {
    setLoanStep(1);
    setLoanAmount('');
    setLoanTenor(loanSettings.max_tenor_months.toString());
    setLoanPurpose('');
    setHasDownloaded(false);
    setUploadedFile(null);
    setCurrentLoanId(null);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string; icon: JSX.Element | null }> = {
      pending_treasurer: { label: 'Menunggu Bendahara', className: 'bg-amber-100 text-amber-700', icon: <Clock size={10} className="mr-1" /> },
      pending_chairman: { label: 'Menunggu Ketua', className: 'bg-blue-100 text-blue-700', icon: <Clock size={10} className="mr-1" /> },
      approved: { label: 'Disetujui', className: 'bg-green-100 text-green-700', icon: <CheckCircle2 size={10} className="mr-1" /> },
      rejected: { label: 'Ditolak', className: 'bg-red-100 text-red-700', icon: <AlertTriangle size={10} className="mr-1" /> },
      active: { label: 'Aktif', className: 'bg-emerald-100 text-emerald-700', icon: <TrendingUp size={10} className="mr-1" /> },
      completed: { label: 'Lunas', className: 'bg-gray-100 text-gray-700', icon: <CheckCircle2 size={10} className="mr-1" /> }
    };
    const s = statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-700', icon: null };
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${s.className}`}>
        {s.icon}
        {s.label}
      </span>
    );
  };

  const calculateRemainingInstallments = (loan: Loan) => {
    const paidInstallments = installments.length;
    const totalInstallments = loan.tenor_months;
    return Math.max(0, totalInstallments - paidInstallments);
  };

  const activeLoan = loans.find(l => l.status === 'active');
  const pendingLoans = loans.filter(l => l.status === 'pending_treasurer' || l.status === 'pending_chairman');
  const completedLoans = loans.filter(l => l.status === 'completed');

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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* Loan Application Modal */}
      <AnimatePresence>
        {showLoanModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => {
                setShowLoanModal(false);
                resetLoanForm();
              }}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 z-10 p-5 border-b border-gray-100 dark:border-neutral-700 flex items-center justify-between bg-gradient-to-r from-imigrasi-primary to-blue-800 text-white">
                <div className="flex items-center gap-2">
                  <HandCoins size={22} />
                  <h3 className="font-bold text-xl">
                    {loanStep === 1 ? 'Pengajuan Pinjaman' : loanStep === 2 ? 'Upload Dokumen' : 'Pengajuan Selesai'}
                  </h3>
                </div>
                <button 
                  onClick={() => {
                    setShowLoanModal(false);
                    resetLoanForm();
                  }} 
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 space-y-6 max-h-[80vh] overflow-y-auto">
              
              <div className="p-6 space-y-6">
                {loanStep === 1 ? (
                  <>
                    {/* Loan Amount Input */}
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <Wallet size={16} className="text-imigrasi-primary" />
                        Jumlah Pinjaman (IDR)
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Rp</span>
                        <input
                          type="number"
                          value={loanAmount}
                          onChange={(e) => setLoanAmount(e.target.value)}
                          placeholder="Contoh: 5000000"
                          className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-2xl outline-none transition-all dark:text-white"
                          placeholder={`Min ${formatCurrency(loanSettings.min_loan_amount)} - Max ${formatCurrency(loanSettings.max_loan_amount)}`} 
                          className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-xl outline-none transition-all dark:text-white"
                        />
                      </div>
                      <p className="text-xs text-gray-400">
                        Minimal: {formatCurrency(loanSettings.min_loan_amount)} | 
                        Maksimal: {formatCurrency(loanSettings.max_loan_amount)}
                      </p>
                    </div>

                    {/* Tenor Selection */}
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Tenor (Bulan)</label>
                      <select
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <Calendar size={16} className="text-imigrasi-primary" />
                        Tenor (Bulan)
                      </label>
                      <select 
                        value={loanTenor}
                        onChange={(e) => setLoanTenor(e.target.value)}
                        className="w-full p-3 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-xl outline-none transition-all dark:text-white"
                      >
                        {getTenorOptions().map(tenor => (
                          <option key={tenor} value={tenor}>{tenor} Bulan</option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-400">Maksimal tenor {loanSettings.max_tenor_months} bulan</p>
                    </div>

                    {/* Purpose Input */}
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <FileText size={16} className="text-imigrasi-primary" />
                        Tujuan Pinjaman (Opsional)
                      </label>
                      <input 
                        type="text" 
                        value={loanPurpose}
                        onChange={(e) => setLoanPurpose(e.target.value)}
                        placeholder="Contoh: Modal usaha, Pendidikan, Kesehatan"
                        className="w-full p-3 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-xl outline-none transition-all dark:text-white"
                      />
                    </div>

                    {/* Simulation Result */}
                    {loanAmount && parseInt(loanAmount) > 0 && (
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
                            <span className="text-blue-700 dark:text-blue-300">Bunga ({loanSettings.default_interest_rate}%)</span>
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

                    {/* Info Box */}
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-900/30">
                      <div className="flex gap-3">
                        <Info size={18} className="text-amber-600 shrink-0 mt-0.5" />
                        <div className="text-xs text-amber-700 dark:text-amber-400 space-y-1">
                          <p className="font-bold">Ketentuan Pinjaman:</p>
                          <p>• Bunga {loanSettings.default_interest_rate}% flat per bulan</p>
                          <p>• Maksimal tenor {loanSettings.max_tenor_months} bulan</p>
                          <p>• Angsuran akan dipotong otomatis dari gaji</p>
                          <p>• Pengajuan akan diverifikasi oleh Bendahara dan Ketua Koperasi</p>
                        </div>
                      </div>
                    </div>
                    <button

                    <button 
                      onClick={handleSubmitLoan}
                      disabled={isLoading || !loanAmount || !loanTenor}
                      className="w-full py-3 bg-imigrasi-primary text-white font-bold rounded-xl hover:bg-blue-900 transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isLoading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                      {isLoading ? 'Memproses...' : 'Lanjut ke Dokumen'}
                    </button>
                  </>
                ) : loanStep === 2 ? (
                  <div className="space-y-6">
                    <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-center">
                      <FileText size={48} className="mx-auto text-blue-600 mb-3" />
                      <h4 className="font-bold text-gray-900 dark:text-white mb-2">Surat Perjanjian Pinjaman</h4>
                      <p className="text-xs text-gray-500 mb-4">Download, cetak, tanda tangani, lalu upload kembali</p>
                      <button
                      <p className="text-xs text-gray-500 mb-4">Download, cetak, tanda tangani di atas materai, lalu upload kembali</p>
                      <button 
                        onClick={handleDownloadAgreement}
                        disabled={isLoading}
                        className="px-6 py-2.5 bg-imigrasi-accent text-imigrasi-primary font-bold rounded-lg hover:bg-white transition-all flex items-center justify-center gap-2 mx-auto"
                      >
                        <Download size={16} />
                        Download Surat Perjanjian
                      </button>
                    </div>

                    {hasDownloaded && (
                      <div className="space-y-4">
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 size={18} className="text-green-600" />
                            <p className="text-sm font-bold text-green-700">Dokumen telah diunduh</p>
                          </div>
                          <p className="text-xs text-green-700 dark:text-green-400">
                            Silakan cetak, isi, tanda tangani di atas materai, lalu upload hasil scan/photo dokumen yang sudah ditandatangani.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <Upload size={16} />
                            Upload Dokumen (PDF/JPG/PNG)
                          </label>
                          <div className="border-2 border-dashed border-gray-300 dark:border-neutral-600 rounded-xl p-6 text-center hover:border-imigrasi-primary transition-colors">
                            <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                            <p className="text-xs text-gray-500 mb-2">Klik atau drag file ke sini</p>
                            <input
                            <p className="text-xs text-gray-500 mb-2">Klik untuk memilih file, maksimal 5MB</p>
                            <input 
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={handleFileUpload}
                              className="hidden"
                              id="document-upload"
                            />
                            <label
                              htmlFor="document-upload"
                              className="inline-block px-4 py-2 bg-gray-100 dark:bg-neutral-700 rounded-lg text-xs font-bold cursor-pointer hover:bg-gray-200 transition-colors"
                            >
                              Pilih File
                            </label>
                            {uploadedFile && (
                              <div className="mt-3 p-2 bg-green-50 rounded-lg">
                                <p className="text-xs text-green-600">✓ File dipilih: {uploadedFile.name}</p>
                                <p className="text-[10px] text-gray-400">{(uploadedFile.size / 1024).toFixed(2)} KB</p>
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={handleUploadDocument}
                          disabled={isLoading || !uploadedFile}
                          className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                          {isLoading ? 'Mengunggah...' : 'Kirim Pengajuan'}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 size={40} className="text-green-600" />
                    </div>
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Pengajuan Terkirim!</h4>
                    <p className="text-sm text-gray-500">Pengajuan pinjaman Anda sedang diproses oleh admin.</p>
                    <p className="text-xs text-gray-400 mt-2">Status dapat dilihat di riwayat pinjaman</p>
                  </div>
                )}
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
              className="relative w-full max-w-2xl bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 z-10 p-5 border-b border-gray-100 dark:border-neutral-700 flex items-center justify-between bg-gradient-to-r from-imigrasi-primary to-blue-800 text-white">
                <h3 className="font-bold text-xl flex items-center gap-2">
                  <Calendar size={20} />
                  Jadwal Angsuran Pinjaman
                </h3>
                <button onClick={() => setShowScheduleModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X size={20} />
                </button>
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
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sisa Angsuran</p>
                    <p className="font-bold text-gray-900 dark:text-white text-sm">{calculateRemainingInstallments(selectedLoan)} bulan</p>
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
                        <div key={installment.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-neutral-700/30 rounded-lg hover:bg-gray-100 transition-colors">
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
                              {installment.payment_method === 'potong_gaji' ? 'Potong Gaji' :
                                installment.payment_method === 'transfer' ? 'Transfer' : 'Tunai'}
                            <p className="text-[10px] text-gray-400 capitalize flex items-center gap-1">
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
            Pantau status pinjaman, angsuran, dan ajukan pinjaman baru.
            Maksimal tenor {loanSettings.max_tenor_months} bulan dengan bunga {loanSettings.default_interest_rate}% per bulan.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-3 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-500 hover:text-imigrasi-primary transition-colors disabled:opacity-50"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setShowLoanModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-imigrasi-primary text-white rounded-xl text-sm font-bold hover:bg-blue-900 transition-colors shadow-lg"
          >
            <HandCoins size={18} />
            Ajukan Pinjaman
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl p-4 text-white">
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
        
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl p-4 text-white">
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
        
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
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

      {/* Active Loan Card */}
      {activeLoan ? (
        <div className="glass-card p-6 rounded-xl bg-gradient-to-br from-imigrasi-primary to-blue-900 text-white border-none relative overflow-hidden">
          <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                {getStatusBadge(activeLoan.status)}
                <span className="text-xs text-white/60 font-mono">ID: {activeLoan.id}</span>
              </div>
              <div>
                <p className="text-white/60 text-sm font-bold uppercase tracking-widest mb-2">Sisa Pinjaman</p>
                <h2 className="text-4xl md:text-5xl font-black">{formatCurrency(activeLoan.remaining_balance)}</h2>
              </div>
            </div>
            <div className="bg-white/5 rounded-3xl p-6 border border-white/10 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Total Pinjaman</span>
                <span className="font-bold">{formatCurrency(activeLoan.amount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Angsuran / Bln</span>
                <span className="font-bold">{formatCurrency(activeLoan.monthly_installment)}</span>
              </div>
              <button
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
          </div>
        </div>
      ) : (
        <div className="glass-card p-10 rounded-xl text-center space-y-4">
          <div className="w-20 h-20 bg-gray-100 dark:bg-neutral-700 rounded-full flex items-center justify-center mx-auto">
            <HandCoins size={40} className="text-gray-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Tidak Ada Pinjaman Aktif</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Anda tidak memiliki pinjaman yang sedang berjalan saat ini.</p>
            <p className="text-xs text-gray-400 mt-1">
              Maksimal tenor {loanSettings.max_tenor_months} bulan, bunga {loanSettings.default_interest_rate}% per bulan
            </p>
          </div>
          <button
            onClick={() => setShowLoanModal(true)}
            className="px-6 py-2.5 bg-imigrasi-primary text-white font-bold rounded-lg hover:bg-blue-900 transition-all shadow-lg"
          >
            Ajukan Pinjaman Sekarang
          </button>
        </div>
      )}

      {/* Loan History Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-neutral-700">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white">Riwayat Pinjaman</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-neutral-800/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-bold">ID</th>
                <th className="px-6 py-4 font-bold">Jumlah</th>
                <th className="px-6 py-4 font-bold">Tenor</th>
                <th className="px-6 py-4 font-bold">Angsuran/Bln</th>
                <th className="px-6 py-4 font-bold">Tanggal</th>
                <th className="px-6 py-4 font-bold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-700">
              {loans.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    Belum ada riwayat pinjaman
                  </td>
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
                    <td className="px-6 py-4 text-sm font-mono text-gray-600 dark:text-gray-300">#{loan.id}</td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(loan.amount)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{loan.tenor_months} Bln</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{formatCurrency(loan.monthly_installment)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(loan.created_at)}
                    </td>
                    <td className="px-6 py-4 text-center">{getStatusBadge(loan.status)}</td>
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
                      {(loan.status === 'pending_treasurer' || loan.status === 'pending_chairman') && (
                        <span className="text-xs text-amber-600 flex items-center gap-1">
                          <Clock size={12} /> Menunggu
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30 flex gap-3">
        <div className="p-2 bg-white dark:bg-neutral-800 rounded-lg text-imigrasi-primary shadow-sm">
          <Info size={18} />
        </div>
        <div>
          <h4 className="font-bold text-blue-900 dark:text-blue-400 text-sm">Informasi Pinjaman</h4>
          <p className="text-xs text-blue-800 dark:text-blue-500/80 leading-relaxed mt-1">
            • Bunga pinjaman: <strong>{loanSettings.default_interest_rate}% flat</strong> per bulan dari total pinjaman<br />
            • Maksimal tenor: <strong>{loanSettings.max_tenor_months} bulan</strong><br />
            • Batas pinjaman: <strong>{formatCurrency(loanSettings.min_loan_amount)} - {formatCurrency(loanSettings.max_loan_amount)}</strong><br />
            • Angsuran akan dipotong otomatis dari gaji setiap bulan setelah pinjaman disetujui dan dicairkan
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default Loans;