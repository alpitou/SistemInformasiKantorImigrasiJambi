// src/pages/admin/SavingsVerification.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  User,
  Wallet,
  Eye,
  FileText,
  Search,
  Filter,
  TrendingUp,
  History,
  Download
} from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import axios from 'axios';

interface PendingSaving {
  id: number;
  user_id: number;
  saving_type_id: number;
  amount: number;
  transaction_type: string;
  description: string | null;
  transaction_date: string;
  proof_image: string;
  created_at: string;
  verification_status: string;
  verified_at?: string;
  verified_by?: number;
  user: {
    id: number;
    name: string;
    nip: string;
    unit: string;
    email: string;
  };
  type: {
    id: number;
    name: string;
  };
  creator?: {
    name: string;
  };
  verifier?: {
    name: string;
  };
}

interface VerifiedHistory {
  id: number;
  user_id: number;
  amount: number;
  verified_at: string;
  user: {
    name: string;
    nip: string;
    unit: string;
  };
  type: {
    name: string;
  };
  verifier?: {
    name: string;
  };
  description: string;
}

const SavingsVerification: React.FC = () => {
  const { addNotification } = useNotifications();
  const [isLoading, setIsLoading] = useState(false);
  const [pendingSavings, setPendingSavings] = useState<PendingSaving[]>([]);
  const [filteredSavings, setFilteredSavings] = useState<PendingSaving[]>([]);
  const [verifiedHistory, setVerifiedHistory] = useState<VerifiedHistory[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [verifyingId, setVerifyingId] = useState<number | null>(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalVerifiedAmount, setTotalVerifiedAmount] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const token = localStorage.getItem('token');
  const axiosInstance = useMemo(() => axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
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

  const fetchPendingSavings = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get('/api/savings');
      if (response.data && response.data.data) {
        const pending = response.data.data.filter(
          (saving: any) => saving.transaction_type === 'deposit' && saving.verification_status === 'pending'
        );
        setPendingSavings(pending);
        setFilteredSavings(pending);

        const total = pending.reduce((sum: number, saving: PendingSaving) => {
          const amount = Number(saving.amount) || 0;
          return sum + amount;
        }, 0);
        setTotalAmount(total);
      }
    } catch (error: any) {
      console.error('Failed to fetch pending savings:', error);
      addNotification({
        title: 'Error',
        message: error.response?.data?.message || 'Gagal mengambil data setoran yang menunggu verifikasi',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  }, [axiosInstance, addNotification]);

  const fetchVerifiedHistory = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/api/savings');
      if (response.data && response.data.data) {
        const verified = response.data.data.filter(
          (saving: any) =>
            saving.transaction_type === 'deposit' &&
            saving.verification_status === 'verified' &&
            saving.type?.name?.toLowerCase() === 'sukarela'
        );

        // Map data untuk history
        const mappedHistory: VerifiedHistory[] = verified.map((item: any) => ({
          id: item.id,
          user_id: item.user_id,
          amount: Number(item.amount) || 0,
          verified_at: item.verified_at || item.created_at,
          user: {
            name: item.user?.name || '-',
            nip: item.user?.nip || '-',
            unit: item.user?.unit || '-'
          },
          type: {
            name: item.type?.name || 'Sukarela'
          },
          verifier: item.verifier,
          description: item.description || ''
        }));

        setVerifiedHistory(mappedHistory);

        const total = mappedHistory.reduce((sum: number, saving: VerifiedHistory) => {
          const amount = Number(saving.amount) || 0;
          return sum + amount;
        }, 0);
        setTotalVerifiedAmount(total);
      }
    } catch (error: any) {
      console.error('Failed to fetch verified history:', error);
    }
  }, [axiosInstance]);

  useEffect(() => {
    fetchPendingSavings();
    fetchVerifiedHistory();
  }, [fetchPendingSavings, fetchVerifiedHistory]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = pendingSavings.filter(saving =>
        saving.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        saving.user.nip?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        saving.user.unit?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSavings(filtered);
    } else {
      setFilteredSavings(pendingSavings);
    }
  }, [searchTerm, pendingSavings]);

  const handleVerify = async (id: number) => {
    setVerifyingId(id);
    try {
      const response = await axiosInstance.put(`/api/savings/${id}/verify`);
      if (response.data.success) {
        addNotification({
          title: 'Berhasil',
          message: 'Setoran berhasil diverifikasi. Saldo anggota telah diperbarui.',
          type: 'success'
        });
        await fetchPendingSavings();
        await fetchVerifiedHistory();
      }
    } catch (error: any) {
      addNotification({
        title: 'Gagal',
        message: error.response?.data?.message || 'Gagal memverifikasi setoran',
        type: 'error'
      });
    } finally {
      setVerifyingId(null);
    }
  };

  const handleViewProof = (proofImage: string) => {
    setSelectedImage(proofImage);
  };

  const handleBulkVerify = async () => {
    if (filteredSavings.length === 0) return;

    if (!window.confirm(`Verifikasi ${filteredSavings.length} setoran sekaligus?`)) return;

    setIsLoading(true);
    let successCount = 0;
    let failCount = 0;

    for (const saving of filteredSavings) {
      try {
        await axiosInstance.put(`/api/savings/${saving.id}/verify`);
        successCount++;
      } catch (error) {
        failCount++;
        console.error(`Failed to verify saving ${saving.id}:`, error);
      }
    }

    addNotification({
      title: 'Verifikasi Massal Selesai',
      message: `${successCount} setoran berhasil diverifikasi, ${failCount} gagal.`,
      type: successCount > 0 ? 'success' : 'error'
    });

    await fetchPendingSavings();
    await fetchVerifiedHistory();
    setIsLoading(false);
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const csvContent = generateCSV(verifiedHistory);
      const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `riwayat_verifikasi_setoran_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      addNotification({
        title: 'Berhasil',
        message: 'Riwayat verifikasi berhasil diexport',
        type: 'success'
      });
    } catch (error: any) {
      addNotification({
        title: 'Gagal',
        message: 'Gagal mengexport riwayat',
        type: 'error'
      });
    } finally {
      setIsExporting(false);
    }
  };

  const generateCSV = (data: VerifiedHistory[]) => {
    const headers = ['No', 'Tanggal Verifikasi', 'Nama Anggota', 'NIP', 'Unit', 'Jumlah Setoran', 'Diverifikasi Oleh'];
    const rows = data.map((item, index) => [
      index + 1,
      formatDate(item.verified_at),
      item.user.name,
      item.user.nip || '-',
      item.user.unit || '-',
      item.amount,
      item.verifier?.name || '-'
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* Image Modal */}
      <AnimatePresence>
        {selectedImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-4xl w-full"
            >
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
              >
                <XCircle size={32} />
              </button>
              {selectedImage.match(/\.(jpg|jpeg|png)$/i) ? (
                <img src={selectedImage} alt="Bukti Transfer" className="w-full rounded-lg shadow-2xl" />
              ) : (
                <iframe src={selectedImage} className="w-full h-[80vh] rounded-lg shadow-2xl" title="Bukti Transfer" />
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Verifikasi Setoran Sukarela</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Verifikasi bukti transfer setoran sukarela dari anggota
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 px-4 py-2 bg-imigrasi-primary dark:bg-neutral-800 text-white dark:text-gray-300 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors"
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
            onClick={() => { fetchPendingSavings(); fetchVerifiedHistory(); }}
            className="p-3 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-500 hover:text-imigrasi-primary transition-colors"
            disabled={isLoading}
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>
          {filteredSavings.length > 1 && (
            <button
              onClick={handleBulkVerify}
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-2 bg-blue-500 text-white rounded-xl text-sm font-bold hover:bg-blue-600 transition-colors shadow-lg"
            >
              <CheckCircle2 size={18} />
              Verifikasi Semua ({filteredSavings.length})
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="p-6 rounded-3xl bg-imigrasi-primary from-amber-500 to-orange-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm">Menunggu Verifikasi</p>
              <p className="text-3xl font-bold mt-2">{pendingSavings.length}</p>
            </div>
            <div className="p-3 bg-white/20 rounded-2xl">
              <Clock size={32} />
            </div>
          </div>
        </div>

        <div className="glass card p-6 rounded-3xl bg-imigrasi-primary from-emerald-500 to-teal-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm">Nilai Setoran Tertunda</p>
              <p className="text-2xl font-bold mt-2">{formatCurrency(totalAmount)}</p>
            </div>
            <div className="p-3 bg-white/20 rounded-2xl">
              <Wallet size={32} />
            </div>
          </div>
        </div>

        <div className="glass card p-6 rounded-3xl bg-imigrasi-primary from-blue-500 to-indigo-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm">Sudah Diverifikasi</p>
              <p className="text-3xl font-bold mt-2">{verifiedHistory.length}</p>
            </div>
            <div className="p-3 bg-white/20 rounded-2xl">
              <CheckCircle2 size={32} />
            </div>
          </div>
        </div>

        <div className="glass card p-6 rounded-3xl bg-imigrasi-primary from-purple-500 to-pink-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm">Total Dana Masuk</p>
              <p className="text-2xl font-bold mt-2">{formatCurrency(totalVerifiedAmount)}</p>
            </div>
            <div className="p-3 bg-white/20 rounded-2xl">
              <TrendingUp size={32} />
            </div>
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
            <div className="glass card p-6 rounded-3xl">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <History size={20} /> Riwayat Verifikasi Setoran Sukarela
              </h3>
              {verifiedHistory.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-neutral-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock size={32} className="text-gray-400" />
                  </div>
                  <p className="text-gray-500">Belum ada riwayat verifikasi setoran</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-neutral-700/50">
                      <tr>
                        <th className="px-4 py-2 text-left">Tanggal</th>
                        <th className="px-4 py-2 text-left">Anggota</th>
                        <th className="px-4 py-2 text-left">NIP</th>
                        <th className="px-4 py-2 text-right">Jumlah</th>
                        <th className="px-4 py-2 text-left">Diverifikasi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-neutral-700">
                      {verifiedHistory.map((item, index) => (
                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-neutral-700/30">
                          <td className="px-4 py-2 text-xs">{formatDate(item.verified_at)}</td>
                          <td className="px-4 py-2 font-medium">{item.user.name}</td>
                          <td className="px-4 py-2 text-xs text-gray-500">{item.user.nip || '-'}</td>
                          <td className="px-4 py-2 text-right font-bold text-emerald-600">
                            {formatCurrency(item.amount)}
                          </td>
                          <td className="px-4 py-2 text-xs text-gray-500">{item.verifier?.name || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 dark:bg-neutral-700/50">
                      <tr>
                        <td colSpan={3} className="px-4 py-2 font-bold">Total</td>
                        <td className="px-4 py-2 text-right font-bold text-emerald-600">
                          {formatCurrency(totalVerifiedAmount)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
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
      </div>

      {/* List of Pending Savings */}
      <div className="space-y-6">
        {isLoading && pendingSavings.length === 0 ? (
          <div className="glass-card p-12 rounded-3xl text-center">
            <div className="flex justify-center">
              <RefreshCw className="animate-spin text-imigrasi-primary" size={32} />
            </div>
            <p className="mt-4 text-gray-500">Memuat data...</p>
          </div>
        ) : filteredSavings.length === 0 ? (
          <div className="glass-card p-12 rounded-3xl text-center">
            <div className="w-20 h-20 bg-gray-100 dark:bg-neutral-700 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={40} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Tidak Ada Setoran Menunggu Verifikasi</h3>
            <p className="text-sm text-gray-500 mt-2">
              {searchTerm
                ? 'Tidak ditemukan setoran yang sesuai dengan pencarian Anda.'
                : 'Semua setoran sukarela sudah diverifikasi.'}
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredSavings.map((saving) => (
              <motion.div
                key={saving.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-card p-6 rounded-3xl border-l-4 border-l-amber-500 hover:shadow-xl transition-shadow"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <img
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${saving.user?.name || 'User'}`}
                      alt=""
                      className="w-14 h-14 rounded-2xl border-2 border-gray-100 dark:border-neutral-700"
                    />
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white text-lg">{saving.user?.name || 'Unknown'}</h4>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                        <span className="text-[10px] font-bold text-imigrasi-primary uppercase tracking-wider bg-imigrasi-primary/10 px-2 py-0.5 rounded">
                          Setoran Sukarela
                        </span>
                        <span className="text-[10px] text-gray-400">•</span>
                        <span className="text-[10px] text-gray-500 font-mono">ID Transaksi: #{saving.id}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <User size={12} />
                          <span>NIP: {saving.user?.nip || '-'}</span>
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <span>Unit: {saving.user?.unit || '-'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-left lg:text-right">
                    <p className="text-xs text-gray-500 mb-1">Jumlah Setoran</p>
                    <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(saving.amount)}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      Diajukan: {formatDate(saving.transaction_date)}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-neutral-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => handleViewProof(saving.proof_image)}
                      className="px-4 py-2 bg-blue-500/10 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-500 hover:text-white transition-all flex items-center gap-2"
                    >
                      <Eye size={14} /> Lihat Bukti Transfer
                    </button>
                    {saving.description && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <FileText size={12} />
                        <span>{saving.description}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleVerify(saving.id)}
                      disabled={verifyingId === saving.id}
                      className="px-6 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-70"
                    >
                      {verifyingId === saving.id ? (
                        <RefreshCw size={16} className="animate-spin" />
                      ) : (
                        <CheckCircle2 size={16} />
                      )}
                      {verifyingId === saving.id ? 'Memproses...' : 'Verifikasi & Update Saldo'}
                    </button>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                  <p className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-2">
                    <Clock size={14} />
                    Menunggu verifikasi. Setelah diverifikasi, saldo anggota akan otomatis bertambah.
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
};

export default SavingsVerification;