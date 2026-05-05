// src/pages/member/Savings.tsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Wallet, TrendingUp, PieChart, ArrowUpRight, ArrowDownRight,
  Download, Info, Calendar, RefreshCw, X, CheckCircle2,
  AlertCircle, Upload, FileText, Trash2, Clock, FileSpreadsheet,
  MessageSquare, DollarSign, Building2, CreditCard, User, Loader2
} from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { cn } from '../../lib/utils';
import api from '../../services/api';

interface SavingType {
  id: number;
  name: string;
  default_amount: number | null;
}

interface SavingTransaction {
  id: number;
  user_id: number;
  saving_type_id: number;
  amount: number;
  transaction_type: 'deposit' | 'withdrawal';
  description: string | null;
  transaction_date: string;
  created_by: number;
  verification_status: 'pending' | 'verified' | 'rejected';
  type?: SavingType;
  creator?: { name: string };
  verifier?: { name: string };
}

interface SavingsSummary {
  Pokok: number;
  Wajib: number;
  Sukarela: number;
  total: number;
}

interface WithdrawalRequest {
  id: number;
  amount: number;
  reason: string;
  status: string;
  created_at: string;
}

const Savings: React.FC = () => {
  const { addNotification } = useNotifications();
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingRekening, setIsDownloadingRekening] = useState(false);

  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawReason, setWithdrawReason] = useState('');
  const [withdrawType, setWithdrawType] = useState<'partial' | 'full'>('partial');
  const [selectedSavingType, setSelectedSavingType] = useState<number>(3);
  const [selectedWithdrawType, setSelectedWithdrawType] = useState<string>('Sukarela');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [summary, setSummary] = useState<SavingsSummary>({
    Pokok: 0,
    Wajib: 0,
    Sukarela: 0,
    total: 0
  });
  const [transactions, setTransactions] = useState<SavingTransaction[]>([]);
  const [savingTypes, setSavingTypes] = useState<SavingType[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingDeposits, setPendingDeposits] = useState(0);

  // Bank account info
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  const userStr = localStorage.getItem('user');
  const user = useMemo(() => {
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }, [userStr]);

  // Fetch user profile data for bank info
  const fetchUserProfile = useCallback(async () => {
    const userId = user?.id;
    if (!userId) return;

    setIsLoadingProfile(true);
    try {
      const response = await api.get(`/users/${userId}`);

      if (response.data.success) {
        const userProfile = response.data.data;

        const bankNameValue = userProfile.bank_name || '';
        const accountNumberValue = userProfile.account_number || '';
        const accountNameValue = userProfile.account_name || userProfile.name || '';

        setBankName(bankNameValue);
        setAccountNumber(accountNumberValue);
        setAccountName(accountNameValue);

        if (bankNameValue) localStorage.setItem('user_bank_name', bankNameValue);
        if (accountNumberValue) localStorage.setItem('user_account_number', accountNumberValue);
        if (accountNameValue) localStorage.setItem('user_account_name', accountNameValue);
      }
    } catch (error: any) {
      console.error('Error fetching user profile:', error);
      const savedBankName = localStorage.getItem('user_bank_name') || '';
      const savedAccountNumber = localStorage.getItem('user_account_number') || '';
      const savedAccountName = localStorage.getItem('user_account_name') || user?.name || '';
      setBankName(savedBankName);
      setAccountNumber(savedAccountNumber);
      setAccountName(savedAccountName);
    } finally {
      setIsLoadingProfile(false);
    }
  }, [user?.id, user?.name]);

  // Fetch withdrawal requests
  const fetchWithdrawalRequests = useCallback(async () => {
    try {
      const response = await api.get('/withdrawals');
      if (response.data.success) {
        setWithdrawalRequests(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch withdrawal requests:', error);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const userId = user?.id || 1;

      const [transactionsRes, typesRes, summaryRes] = await Promise.all([
        api.get('/savings'),
        api.get('/saving-types'),
        api.get(`/savings/summary/${userId}`)
      ]);

      if (transactionsRes.data.success) {
        const transactionsData = transactionsRes.data.data;
        setTransactions(transactionsData);
        const pending = transactionsData.filter(
          (t: SavingTransaction) => t.transaction_type === 'deposit' && t.verification_status === 'pending'
        ).length;
        setPendingDeposits(pending);
      }

      if (typesRes.data.success) {
        setSavingTypes(typesRes.data.data);
      }

      if (summaryRes.data.success) {
        setSummary(summaryRes.data.data);
      }

      await fetchUserProfile();
      await fetchWithdrawalRequests();

    } catch (error: any) {
      console.error('Error fetching savings data:', error);
      addNotification({
        title: 'Gagal Memuat Data',
        message: error.response?.data?.message || 'Terjadi kesalahan saat memuat data simpanan.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [addNotification, user?.id, fetchUserProfile, fetchWithdrawalRequests]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = async () => {
    setLoading(true);
    await fetchData();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      addNotification({
        title: 'Format File Tidak Valid',
        message: 'Hanya file JPG, PNG, atau PDF yang diperbolehkan.',
        type: 'error'
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      addNotification({
        title: 'Ukuran File Terlalu Besar',
        message: 'Maksimal ukuran file adalah 5MB.',
        type: 'error'
      });
      return;
    }

    setUploadedFile(file);
  };

  const removeFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadFile = async (): Promise<string | null> => {
    if (!uploadedFile) return null;

    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('proof_image', uploadedFile);

    try {
      const response = await api.post('/savings/upload-proof', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        }
      });

      return response.data.data.path;
    } catch (error: any) {
      console.error('Upload error:', error);
      addNotification({
        title: 'Upload Gagal',
        message: error.response?.data?.message || 'Gagal mengupload bukti transfer.',
        type: 'error'
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeposit = async () => {
    if (!depositAmount) {
      addNotification({
        title: 'Validasi Gagal',
        message: 'Silakan masukkan jumlah setoran.',
        type: 'error'
      });
      return;
    }

    if (!uploadedFile) {
      addNotification({
        title: 'Validasi Gagal',
        message: 'Silakan upload bukti transfer terlebih dahulu.',
        type: 'error'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const proofPath = await uploadFile();

      if (!proofPath) {
        throw new Error('Gagal mengupload bukti transfer');
      }

      const userId = user?.id || 1;

      await api.post('/savings', {
        user_id: userId,
        saving_type_id: selectedSavingType,
        amount: Number(depositAmount),
        transaction_type: 'deposit',
        description: 'Setoran simpanan sukarela via dashboard',
        transaction_date: new Date().toISOString().split('T')[0],
        proof_image: proofPath
      });

      await fetchData();

      addNotification({
        title: 'Setoran Diajukan',
        message: `Setoran simpanan sukarela sebesar ${formatCurrency(Number(depositAmount))} telah diajukan dan menunggu verifikasi bendahara.`,
        type: 'success'
      });

      setShowDepositModal(false);
      setDepositAmount('');
      setUploadedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error: any) {
      console.error('Deposit error:', error);
      addNotification({
        title: 'Setoran Gagal',
        message: error.response?.data?.message || 'Terjadi kesalahan saat melakukan setoran.',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get available balance for withdrawal based on selected type
  const getAvailableBalance = () => {
    switch (selectedWithdrawType) {
      case 'Pokok': return summary?.Pokok || 0;
      case 'Wajib': return summary?.Wajib || 0;
      case 'Sukarela': return summary?.Sukarela || 0;
      default: return summary?.total || 0;
    }
  };

  const handleWithdraw = async () => {
    let amountToWithdraw = Number(withdrawAmount);
    const availableBalance = getAvailableBalance();

    if (withdrawType === 'full') {
      amountToWithdraw = availableBalance;
    }

    if (amountToWithdraw <= 0) {
      addNotification({
        title: 'Validasi Gagal',
        message: 'Silakan masukkan jumlah penarikan yang valid.',
        type: 'error'
      });
      return;
    }

    if (amountToWithdraw > availableBalance) {
      addNotification({
        title: 'Validasi Gagal',
        message: `Jumlah penarikan melebihi saldo ${selectedWithdrawType} yang tersedia (${formatCurrency(availableBalance)}).`,
        type: 'error'
      });
      return;
    }

    if (!withdrawReason) {
      addNotification({
        title: 'Validasi Gagal',
        message: 'Silakan isi alasan penarikan.',
        type: 'error'
      });
      return;
    }

    if (!bankName || !accountNumber || !accountName) {
      addNotification({
        title: 'Validasi Gagal',
        message: 'Silakan lengkapi data rekening bank tujuan transfer di halaman Profil terlebih dahulu.',
        type: 'error'
      });
      return;
    }

    setIsWithdrawing(true);

    try {
      const response = await api.post('/withdrawals', {
        amount: amountToWithdraw,
        reason: withdrawReason,
        saving_type: selectedWithdrawType,
        bank_name: bankName,
        account_number: accountNumber,
        account_name: accountName
      });

      if (response.data.success) {
        addNotification({
          title: 'Pengajuan Penarikan Dikirim',
          message: response.data.message || `Pengajuan penarikan sebesar ${formatCurrency(amountToWithdraw)} dari Simpanan ${selectedWithdrawType} telah dikirim.`,
          type: 'success'
        });

        setShowWithdrawModal(false);
        setWithdrawAmount('');
        setWithdrawReason('');
        setWithdrawType('partial');
        setSelectedWithdrawType('Sukarela');

        // Refresh data
        await fetchData();
        await fetchWithdrawalRequests();
      } else {
        throw new Error(response.data.message || 'Gagal mengajukan penarikan');
      }
    } catch (error: any) {
      console.error('Withdraw error:', error);
      addNotification({
        title: 'Pengajuan Gagal',
        message: error.response?.data?.message || error.message || 'Terjadi kesalahan saat mengajukan penarikan.',
        type: 'error'
      });
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleDownloadReport = async () => {
    setIsDownloading(true);
    try {
      const userId = user?.id || 1;

      const response = await api.get('/savings/report/download', {
        params: { user_id: userId },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `laporan_simpanan_${user?.name || 'saya'}_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      addNotification({
        title: 'Download Berhasil',
        message: 'Laporan simpanan berhasil diunduh.',
        type: 'success'
      });
    } catch (error: any) {
      console.error('Download error:', error);
      addNotification({
        title: 'Download Gagal',
        message: error.response?.data?.message || 'Gagal mengunduh laporan.',
        type: 'error'
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadRekeningKoran = async () => {
    setIsDownloadingRekening(true);
    try {
      const userId = user?.id || 1;
      const monthName = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }).toUpperCase();

      const response = await api.get(`/report/rekening-koran/${userId}`, {
        params: { month: monthName },
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `rekening_koran_${user?.name || 'user'}_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      addNotification({
        title: 'Berhasil',
        message: 'Rekening Koran berhasil diunduh.',
        type: 'success'
      });
    } catch (error: any) {
      console.error('Rekening Koran download error:', error);
      addNotification({
        title: 'Download Gagal',
        message: error.response?.data?.message || 'Gagal mengunduh Rekening Koran.',
        type: 'error'
      });
    } finally {
      setIsDownloadingRekening(false);
    }
  };

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

  const savingsTypes = [
    { label: 'Simpanan Pokok', value: summary?.Pokok ?? 0, icon: Wallet, color: 'bg-blue-500', desc: 'Simpanan awal saat menjadi anggota.', canWithdraw: true },
    { label: 'Simpanan Wajib', value: summary?.Wajib ?? 0, icon: TrendingUp, color: 'bg-emerald-500', desc: 'Simpanan rutin bulanan anggota.', canWithdraw: true },
    { label: 'Simpanan Sukarela', value: summary?.Sukarela ?? 0, icon: PieChart, color: 'bg-amber-500', desc: 'Simpanan tambahan yang bisa ditarik sewaktu-waktu.', canWithdraw: true },
  ];

  const pendingWithdrawals = withdrawalRequests.filter(w => w.status === 'pending_treasurer' || w.status === 'pending_chairman');
  const pendingWithdrawalTotal = pendingWithdrawals.reduce((sum, w) => sum + w.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw size={40} className="animate-spin text-imigrasi-primary mx-auto mb-4" />
          <p className="text-gray-500">Memuat data simpanan...</p>
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
      {/* Deposit Modal */}
      <AnimatePresence>
        {showDepositModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => {
                setShowDepositModal(false);
                setUploadedFile(null);
                setDepositAmount('');
              }}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-5 border-b border-gray-100 dark:border-neutral-700 flex items-center justify-between bg-emerald-500 text-white">
                <h3 className="font-bold text-lg">Setor Simpanan Sukarela</h3>
                <button
                  onClick={() => {
                    setShowDepositModal(false);
                    setUploadedFile(null);
                    setDepositAmount('');
                  }}
                  className="p-1 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-5 space-y-5">
                <div>
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Jumlah Setoran (IDR)</label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Rp</span>
                    <input
                      type="number"
                      placeholder="Contoh: 100000"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="w-full pl-12 pr-3 py-2 bg-gray-50 dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 rounded-lg focus:border-imigrasi-accent outline-none transition-all dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Upload Bukti Transfer</label>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,application/pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {!uploadedFile ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className={cn(
                        "mt-1 w-full p-6 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer transition-all",
                        "bg-gray-50 dark:bg-neutral-700 border-gray-200 dark:border-neutral-600 text-gray-400 hover:border-imigrasi-accent hover:text-imigrasi-primary"
                      )}
                    >
                      <Upload size={24} />
                      <span className="text-xs font-bold text-center">Klik untuk Upload Bukti Transfer</span>
                      <span className="text-[10px] text-gray-400">Format: JPG, PNG, PDF (Max 5MB)</span>
                    </div>
                  ) : (
                    <div className="mt-1 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-500 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText size={20} className="text-emerald-600" />
                          <div>
                            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                              {uploadedFile.name}
                            </p>
                            <p className="text-[10px] text-emerald-600">
                              {(uploadedFile.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                        </div>
                        <button onClick={removeFile} className="p-1 hover:bg-emerald-200 rounded">
                          <Trash2 size={16} className="text-emerald-600" />
                        </button>
                      </div>
                      {isUploading && (
                        <div className="mt-2">
                          <div className="h-1 bg-emerald-200 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-600 transition-all" style={{ width: `${uploadProgress}%` }} />
                          </div>
                          <p className="text-[10px] text-emerald-600 mt-1 text-center">Mengupload... {uploadProgress}%</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-xs text-blue-700 dark:text-blue-400">
                    * Setoran simpanan sukarela memerlukan verifikasi manual oleh bendahara setelah bukti transfer diunggah.
                  </p>
                </div>

                <button
                  onClick={handleDeposit}
                  disabled={isSubmitting || !depositAmount || !uploadedFile || isUploading}
                  className="w-full py-2 bg-imigrasi-primary text-white font-bold rounded-lg hover:bg-blue-900 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {(isSubmitting || isUploading) && <Loader2 size={16} className="animate-spin" />}
                  {isUploading ? 'Mengupload...' : isSubmitting ? 'Memproses...' : 'Ajukan Setoran'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Withdrawal Modals */}
      <AnimatePresence>
        {showWithdrawModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowWithdrawModal(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 z-10 p-4 border-b border-gray-100 dark:border-neutral-700 flex items-center justify-between bg-amber-500 text-white">
                <h3 className="font-bold text-lg">Tarik Simpanan</h3>
                <button onClick={() => setShowWithdrawModal(false)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 space-y-5">
                {/* Informasi Saldo */}
                <div className="p-3 bg-gray-50 dark:bg-neutral-700/30 rounded-lg">
                  <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Informasi Saldo</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total Simpanan</span>
                      <span className="font-bold">{formatCurrency(summary?.total ?? 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Simpanan Pokok</span>
                      <span className="font-bold text-blue-600">{formatCurrency(summary?.Pokok ?? 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Simpanan Wajib</span>
                      <span className="font-bold text-emerald-600">{formatCurrency(summary?.Wajib ?? 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Simpanan Sukarela</span>
                      <span className="font-bold text-amber-600">{formatCurrency(summary?.Sukarela ?? 0)}</span>
                    </div>
                  </div>
                </div>

                {/* Pilih Jenis Simpanan yang Akan Ditarik */}
                <div>
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Pilih Simpanan yang Akan Ditarik</label>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => setSelectedWithdrawType('Pokok')}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${selectedWithdrawType === 'Pokok'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-neutral-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                        }`}
                    >
                      Pokok
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedWithdrawType('Wajib')}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${selectedWithdrawType === 'Wajib'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gray-100 dark:bg-neutral-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                        }`}
                    >
                      Wajib
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedWithdrawType('Sukarela')}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${selectedWithdrawType === 'Sukarela'
                          ? 'bg-amber-600 text-white'
                          : 'bg-gray-100 dark:bg-neutral-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                        }`}
                    >
                      Sukarela
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Saldo tersedia: {formatCurrency(getAvailableBalance())}
                  </p>
                </div>

                {/* Jenis Penarikan */}
                <div>
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Jenis Penarikan</label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => setWithdrawType('partial')}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${withdrawType === 'partial'
                          ? 'bg-amber-500 text-white'
                          : 'bg-gray-100 dark:bg-neutral-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                        }`}
                    >
                      Sebagian
                    </button>
                    <button
                      type="button"
                      onClick={() => setWithdrawType('full')}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${withdrawType === 'full'
                          ? 'bg-amber-500 text-white'
                          : 'bg-gray-100 dark:bg-neutral-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                        }`}
                    >
                      Seluruh Saldo
                    </button>
                  </div>
                </div>

                {/* Jumlah Penarikan */}
                {withdrawType === 'partial' && (
                  <div>
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Jumlah Penarikan (IDR)</label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Rp</span>
                      <input
                        type="number"
                        placeholder="Contoh: 50000"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="w-full pl-12 pr-3 py-2 bg-gray-50 dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 rounded-lg focus:border-amber-500 outline-none"
                      />
                    </div>
                    {Number(withdrawAmount) > getAvailableBalance() && withdrawAmount && (
                      <p className="text-xs text-red-500 mt-1">Jumlah melebihi saldo yang tersedia</p>
                    )}
                  </div>
                )}

                {withdrawType === 'full' && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                      Anda akan menarik seluruh saldo Simpanan {selectedWithdrawType} sebesar <strong>{formatCurrency(getAvailableBalance())}</strong>
                    </p>
                  </div>
                )}

                {/* Alasan Penarikan */}
                <div>
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Alasan Penarikan</label>
                  <select
                    value={withdrawReason}
                    onChange={(e) => setWithdrawReason(e.target.value)}
                    className="w-full px-3 py-2 mt-1 bg-gray-50 dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 rounded-lg focus:border-amber-500 outline-none"
                  >
                    <option value="">Pilih alasan penarikan</option>
                    <option value="Keperluan Pendidikan">Keperluan Pendidikan</option>
                    <option value="Keperluan Kesehatan">Keperluan Kesehatan</option>
                    <option value="Pembangunan Rumah">Pembangunan Rumah</option>
                    <option value="Investasi">Investasi</option>
                    <option value="Keperluan Keluarga">Keperluan Keluarga</option>
                    <option value="Keadaan Darurat">Keadaan Darurat</option>
                    <option value="Masa Pensiun">Masa Pensiun</option>
                    <option value="Keluar Keanggotaan">Keluar Keanggotaan</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                {/* Informasi Rekening Tujuan */}
                <div className="pt-2 border-t border-gray-100 dark:border-neutral-700">
                  <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-3 flex items-center gap-2">
                    <Building2 size={14} className="text-amber-500" />
                    Informasi Rekening Tujuan Transfer
                  </h4>

                  {(!bankName && !accountNumber && !accountName) && !isLoadingProfile && (
                    <div className="p-2 bg-yellow-50 rounded-lg text-xs text-yellow-700 mb-3">
                      Data rekening belum diisi. Silakan lengkapi data rekening di halaman Profil terlebih dahulu.
                    </div>
                  )}

                  <div className="space-y-2">
                    <div>
                      <label className="text-xs font-bold text-gray-500">Nama Bank</label>
                      <div className="relative mt-1">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input
                          type="text"
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                          placeholder="Contoh: Bank Mandiri, BCA, BRI"
                          className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 rounded-lg focus:border-amber-500 outline-none text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-500">Nomor Rekening</label>
                      <div className="relative mt-1">
                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input
                          type="text"
                          value={accountNumber}
                          onChange={(e) => setAccountNumber(e.target.value)}
                          placeholder="Masukkan nomor rekening"
                          className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 rounded-lg focus:border-amber-500 outline-none text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-500">Nama Pemilik Rekening</label>
                      <div className="relative mt-1">
                        <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={accountName}
                          onChange={(e) => setAccountName(e.target.value)}
                          placeholder="Nama sesuai rekening"
                          className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 rounded-lg focus:border-amber-500 outline-none text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info Box */}
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    * Penarikan akan diproses melalui workflow: Pengajuan → Verifikasi Bendahara → Persetujuan Ketua → Pencairan Dana.
                    Proses ini memerlukan waktu 1x24 jam kerja setelah disetujui.
                  </p>
                </div>

                {/* Pending Withdrawals Info */}
                {pendingWithdrawals.length > 0 && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-xs text-blue-700 dark:text-blue-400">
                      ⏳ Anda memiliki {pendingWithdrawals.length} pengajuan penarikan yang sedang diproses.
                      Total pending: {formatCurrency(pendingWithdrawalTotal)}
                    </p>
                  </div>
                )}

                <button
                  onClick={handleWithdraw}
                  disabled={isWithdrawing || (withdrawType === 'partial' && (!withdrawAmount || Number(withdrawAmount) <= 0)) || (withdrawType === 'full' && getAvailableBalance() <= 0) || !withdrawReason || !bankName || !accountNumber || !accountName}
                  className="w-full py-2 bg-amber-500 text-white font-bold rounded-lg hover:bg-amber-600 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {isWithdrawing ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  {isWithdrawing ? 'Memproses...' : 'Ajukan Penarikan'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Simpanan Saya</h1>
          <p className="text-gray-500 dark:text-gray-400">Kelola dan pantau pertumbuhan modal Anda di Koperasi.</p>
        </div>
        <div className="flex items-center gap-3">
          {pendingDeposits > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Clock size={14} className="text-blue-600" />
              <span className="text-xs font-bold text-blue-700 dark:text-blue-400">
                {pendingDeposits} setoran menunggu verifikasi
              </span>
            </div>
          )}
          {pendingWithdrawals.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <Clock size={14} className="text-amber-600" />
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                {pendingWithdrawals.length} penarikan diproses
              </span>
            </div>
          )}
          <button
            onClick={handleRefresh}
            className="p-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg text-gray-500 hover:text-imigrasi-primary transition-colors"
          >
            <RefreshCw size={18} />
          </button>
          <button
            onClick={handleDownloadRekeningKoran}
            disabled={isDownloadingRekening}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-bold hover:bg-purple-700 transition-colors disabled:opacity-70"
          >
            {isDownloadingRekening ? <Loader2 size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />}
            Rekening Koran
          </button>
          <button
            onClick={handleDownloadReport}
            disabled={isDownloading}
            className="flex items-center gap-2 px-4 py-2 bg-imigrasi-primary text-white rounded-lg text-sm font-bold hover:bg-blue-900 transition-colors disabled:opacity-70"
          >
            {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            Laporan Simpanan
          </button>
        </div>
      </div>

      {/* Total Balance Card */}
      <div className="glass-card p-6 rounded-xl bg-gradient-to-br from-imigrasi-primary to-blue-900 text-white border-none relative overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-white/5 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">Total Saldo Simpanan</p>
            <h2 className="text-3xl md:text-4xl font-black">{formatCurrency(summary?.total ?? 0)}</h2>
            <div className="mt-2 flex flex-wrap gap-3 text-xs">
              <span className="text-white/60">Pokok: {formatCurrency(summary?.Pokok ?? 0)}</span>
              <span className="text-white/60">Wajib: {formatCurrency(summary?.Wajib ?? 0)}</span>
              <span className="text-white/60">Sukarela: {formatCurrency(summary?.Sukarela ?? 0)}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowWithdrawModal(true)}
              className="px-5 py-2 bg-white text-imigrasi-primary font-bold rounded-lg hover:bg-imigrasi-accent transition-colors text-sm"
            >
              Tarik Simpanan
            </button>
            <button
              onClick={() => setShowDepositModal(true)}
              className="px-5 py-2 bg-white/10 text-white font-bold rounded-lg hover:bg-white/20 transition-colors border border-white/20 text-sm"
            >
              Setor Sukarela
            </button>
          </div>
        </div>
      </div>

      {/* Savings Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {savingsTypes.map((type) => (
          <div key={type.label} className="glass-card p-5 rounded-xl group hover:border-imigrasi-accent transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 ${type.color} text-white rounded-lg shadow-lg group-hover:scale-105 transition-transform`}>
                <type.icon size={20} />
              </div>
              <Info size={16} className="text-gray-300 cursor-help" title={type.desc} />
            </div>
            <h4 className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">{type.label}</h4>
            <p className="text-xl font-bold text-gray-900 dark:text-white mb-3">{formatCurrency(type.value)}</p>
            <p className="text-xs text-gray-400 leading-relaxed">{type.desc}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transaction History */}
        <div className="lg:col-span-2 glass-card rounded-xl overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-neutral-700">
            <h3 className="font-bold text-gray-900 dark:text-white">Aktivitas Simpanan</h3>
          </div>
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            {transactions.length === 0 ? (
              <div className="p-12 text-center">
                <Wallet size={40} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">Belum ada aktivitas simpanan</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50 dark:bg-neutral-800/50">
                  <tr className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                    <th className="px-4 py-3">Keterangan</th>
                    <th className="px-4 py-3">Tanggal</th>
                    <th className="px-4 py-3 text-right">Jumlah</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-neutral-700">
                  {transactions.slice(0, 20).map((trx) => (
                    <tr key={trx.id} className="hover:bg-gray-50 dark:hover:bg-neutral-700/30 transition-colors">
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${trx.transaction_type === 'deposit'
                              ? 'bg-green-100 text-green-600'
                              : 'bg-amber-100 text-amber-600'
                            }`}>
                            {trx.transaction_type === 'deposit'
                              ? <ArrowUpRight size={14} />
                              : <ArrowDownRight size={14} />
                            }
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {trx.transaction_type === 'deposit' ? 'Setoran' : 'Penarikan'} {trx.type?.name || 'Simpanan'}
                            </p>
                            <p className="text-[10px] text-gray-500">
                              {trx.description || `Transaksi ${trx.transaction_type === 'deposit' ? 'setoran' : 'penarikan'}`}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-xs text-gray-600 dark:text-gray-300">
                        {formatDate(trx.transaction_date)}
                      </td>
                      <td className={`px-4 py-2 text-xs font-bold text-right ${trx.transaction_type === 'deposit'
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                        }`}>
                        {trx.transaction_type === 'deposit' ? '+' : '-'}{formatCurrency(trx.amount)}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {trx.transaction_type === 'deposit' && trx.verification_status === 'pending' ? (
                          <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-[10px] font-bold flex items-center gap-1 w-fit mx-auto">
                            <Clock size={10} /> Menunggu
                          </span>
                        ) : trx.transaction_type === 'withdrawal' ? (
                          <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">
                            Diproses
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold">
                            Selesai
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {transactions.length > 20 && (
              <div className="p-3 text-center border-t">
                <p className="text-xs text-gray-400">Menampilkan 20 transaksi terbaru dari {transactions.length}</p>
              </div>
            )}
          </div>
        </div>

        {/* Info Sidebar */}
        <div className="space-y-5">
          <div className="glass-card p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30">
            <h4 className="font-bold text-blue-900 dark:text-blue-400 text-sm mb-3">Ketentuan Simpanan</h4>
            <ul className="space-y-3 text-xs">
              <li className="flex gap-2">
                <div className="shrink-0 w-4 h-4 bg-blue-500 text-white rounded-full flex items-center justify-center text-[8px] font-bold">1</div>
                <p className="text-blue-800 dark:text-blue-500/80">Simpanan Wajib dipotong otomatis dari gaji setiap bulan.</p>
              </li>
              <li className="flex gap-2">
                <div className="shrink-0 w-4 h-4 bg-blue-500 text-white rounded-full flex items-center justify-center text-[8px] font-bold">2</div>
                <p className="text-blue-800 dark:text-blue-500/80">Semua jenis simpanan dapat ditarik dengan pengajuan persetujuan.</p>
              </li>
              <li className="flex gap-2">
                <div className="shrink-0 w-4 h-4 bg-blue-500 text-white rounded-full flex items-center justify-center text-[8px] font-bold">3</div>
                <p className="text-blue-800 dark:text-blue-500/80">Penarikan diproses melalui workflow: Bendahara → Ketua → Pencairan.</p>
              </li>
            </ul>
          </div>

          <div className="glass-card p-4 rounded-xl text-center space-y-3">
            <div className="w-12 h-12 bg-imigrasi-accent/10 rounded-lg flex items-center justify-center mx-auto">
              <TrendingUp size={20} className="text-imigrasi-accent" />
            </div>
            <h4 className="font-bold text-gray-900 dark:text-white text-sm">Partisipasi Modal</h4>
            <p className="text-xs text-gray-500">Semakin besar simpanan Anda, semakin besar potensi SHU yang akan Anda terima.</p>
          </div>

        </div>
      </div>
    </motion.div>
  );
};

export default Savings;