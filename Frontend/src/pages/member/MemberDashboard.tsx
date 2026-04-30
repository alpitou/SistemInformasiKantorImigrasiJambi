import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Wallet,
  HandCoins,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import axios from 'axios';

interface DashboardStats {
  total_savings: number;
  total_savings_formatted: string;
  remaining_loan: number;
  remaining_loan_formatted: string;
  monthly_installment: number;
  monthly_installment_formatted: string;
  remaining_tenor: number;
  estimated_shu: number;
  estimated_shu_formatted: string;
  has_active_loan: boolean;
  member_status: string;
  is_verified: boolean;
  pokok: number;
  wajib: number;
  sukarela: number;
}

interface RecentTransaction {
  id: string;
  type: string;
  category: string;
  title: string;
  description: string;
  amount: number;
  date: string;
  status: string;
  status_color: string;
  icon: string;
}

interface MemberProfile {
  id: number;
  name: string;
  nip: string;
  nik: string;
  unit: string;
  email: string;
  phone: string;
  join_date: string;
  status: string;
  role: string;
  avatar: string;
}

const MemberDashboard: React.FC = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [loanAmount, setLoanAmount] = useState('');
  const [loanTenor, setLoanTenor] = useState('12');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getAxiosInstance = () => {
    const token = localStorage.getItem('token');
    return axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const axiosInstance = getAxiosInstance();

      const [statsRes, transactionsRes, profileRes] = await Promise.all([
        axiosInstance.get('/member/dashboard/stats'),
        axiosInstance.get('/member/dashboard/transactions'),
        axiosInstance.get('/member/profile')
      ]);

      if (statsRes.data.success) setStats(statsRes.data.data);
      if (transactionsRes.data.success) setRecentTransactions(transactionsRes.data.data);
      if (profileRes.data.success) setProfile(profileRes.data.data);

    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      if (addNotification) {
        addNotification({
          title: 'Gagal Memuat Data',
          message: error.response?.data?.message || 'Terjadi kesalahan saat memuat data dashboard.',
          type: 'error'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);

    if (addNotification) {
      addNotification({
        title: 'Data Diperbarui',
        message: 'Dashboard telah diperbarui dengan data terbaru.',
        type: 'success'
      });
    }
  };

  const handleSubmitLoan = async () => {
    if (!loanAmount || !loanTenor) {
      addNotification({
        title: 'Error',
        message: 'Harap isi jumlah pinjaman dan tenor',
        type: 'error'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const axiosInstance = getAxiosInstance();
      const response = await axiosInstance.post('/loans', {
        amount: parseInt(loanAmount),
        tenor_months: parseInt(loanTenor),
        interest_rate: 1.0
      });

      if (response.data.success) {
        addNotification({
          title: 'Pengajuan Berhasil',
          message: 'Pengajuan pinjaman berhasil dikirim. Silakan upload dokumen perjanjian.',
          type: 'success'
        });
        setShowLoanModal(false);
        setLoanAmount('');
        setLoanTenor('12');
        fetchDashboardData();
      }
    } catch (error: any) {
      addNotification({
        title: 'Pengajuan Gagal',
        message: error.response?.data?.message || 'Gagal mengajukan pinjaman',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount) {
      addNotification({
        title: 'Error',
        message: 'Harap isi jumlah penarikan',
        type: 'error'
      });
      return;
    }

    if (stats && parseInt(withdrawAmount) > stats.sukarela) {
      addNotification({
        title: 'Error',
        message: 'Jumlah penarikan melebihi saldo sukarela',
        type: 'error'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const axiosInstance = getAxiosInstance();
      const userData = await axiosInstance.get('/me');
      const userId = userData.data.data.id;

      const response = await axiosInstance.post('/savings', {
        user_id: userId,
        saving_type_id: 3, // Sukarela
        amount: parseInt(withdrawAmount),
        transaction_type: 'withdrawal',
        description: 'Penarikan simpanan sukarela',
        transaction_date: new Date().toISOString().split('T')[0]
      });

      if (response.data.success) {
        addNotification({
          title: 'Penarikan Berhasil',
          message: `Penarikan sebesar ${formatCurrency(parseInt(withdrawAmount))} berhasil diproses.`,
          type: 'success'
        });
        setShowWithdrawModal(false);
        setWithdrawAmount('');
        fetchDashboardData();
      }
    } catch (error: any) {
      addNotification({
        title: 'Penarikan Gagal',
        message: error.response?.data?.message || 'Gagal melakukan penarikan',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
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

  const getIconComponent = (iconName: string) => {
    if (iconName === 'ArrowUpRight') return ArrowUpRight;
    if (iconName === 'ArrowDownRight') return ArrowDownRight;
    return ArrowUpRight;
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw size={40} className="animate-spin text-imigrasi-primary mx-auto mb-4" />
          <p className="text-gray-500">Memuat data dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
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
              onClick={() => setShowLoanModal(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-neutral-800 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 dark:border-neutral-700 flex items-center justify-between bg-imigrasi-primary text-white">
                <h3 className="font-bold text-xl">Pengajuan Pinjaman</h3>
                <button onClick={() => setShowLoanModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Jumlah Pinjaman (IDR)</label>
                  <input
                    type="number"
                    placeholder="Contoh: 5000000"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(e.target.value)}
                    className="w-full p-4 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-2xl outline-none transition-all dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Tenor (Bulan)</label>
                  <select
                    value={loanTenor}
                    onChange={(e) => setLoanTenor(e.target.value)}
                    className="w-full p-4 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-2xl outline-none transition-all dark:text-white"
                  >
                    <option value="6">6 Bulan</option>
                    <option value="12">12 Bulan</option>
                    <option value="24">24 Bulan</option>
                  </select>
                </div>
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-900/30">
                  <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                    * Pengajuan akan diverifikasi oleh Bendahara dan Ketua Koperasi. Pastikan data yang Anda masukkan benar.
                  </p>
                </div>
                <button
                  onClick={handleSubmitLoan}
                  disabled={isSubmitting || !loanAmount}
                  className="w-full py-4 bg-imigrasi-primary text-white font-bold rounded-2xl hover:bg-blue-900 transition-all shadow-lg shadow-imigrasi-primary/20 disabled:opacity-50"
                >
                  {isSubmitting ? <RefreshCw size={18} className="animate-spin mx-auto" /> : 'Kirim Pengajuan'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Withdrawal Modal */}
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
              className="relative w-full max-w-lg bg-white dark:bg-neutral-800 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 dark:border-neutral-700 flex items-center justify-between bg-imigrasi-accent text-imigrasi-primary">
                <h3 className="font-bold text-xl">Penarikan Sukarela</h3>
                <button onClick={() => setShowWithdrawModal(false)} className="p-2 hover:bg-black/10 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-blue-800 dark:text-blue-400 uppercase">Saldo Sukarela</span>
                    <span className="text-sm font-bold text-blue-900 dark:text-blue-300">
                      {stats ? formatCurrency(stats.sukarela) : 'Rp 0'}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Jumlah Penarikan (IDR)</label>
                  <input
                    type="number"
                    placeholder="Contoh: 100000"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full p-4 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-2xl outline-none transition-all dark:text-white"
                  />
                </div>
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-900/30">
                  <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                    * Penarikan simpanan sukarela akan diproses dalam 1x24 jam hari kerja. Dana akan ditransfer ke rekening gaji Anda.
                  </p>
                </div>
                <button
                  onClick={handleWithdraw}
                  disabled={isSubmitting || !withdrawAmount || (stats && parseInt(withdrawAmount) > stats.sukarela)}
                  className="w-full py-4 bg-imigrasi-primary text-white font-bold rounded-2xl hover:bg-blue-900 transition-all shadow-lg shadow-imigrasi-primary/20 disabled:opacity-50"
                >
                  {isSubmitting ? <RefreshCw size={18} className="animate-spin mx-auto" /> : 'Kirim Permohonan'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Anggota</h1>
          <p className="text-gray-500 dark:text-gray-400">Ringkasan aktivitas keuangan Anda di Koperasi Kanim Jambi.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-3 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-500 hover:text-imigrasi-primary transition-colors"
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <div className="flex items-center gap-2 bg-imigrasi-primary/5 dark:bg-white/5 px-4 py-2 rounded-xl border border-imigrasi-primary/10 dark:border-white/10">
            <Calendar className="text-imigrasi-primary dark:text-imigrasi-accent" size={18} />
            <span className="text-sm font-medium text-imigrasi-primary dark:text-white">
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div variants={itemVariants} className="glass-card p-6 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Wallet size={80} />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
              <Wallet size={20} />
            </div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Simpanan</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats ? stats.total_savings_formatted : 'Rp 0'}
          </h3>
          <div className="mt-4 flex items-center gap-1 text-xs font-medium text-green-500">
            <ArrowUpRight size={14} />
            <span>Pokok: {stats ? formatCurrency(stats.pokok) : 'Rp 0'} • Wajib: {stats ? formatCurrency(stats.wajib) : 'Rp 0'}</span>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="glass-card p-6 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <HandCoins size={80} />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
              <HandCoins size={20} />
            </div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Sisa Pinjaman</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats ? stats.remaining_loan_formatted : 'Rp 0'}
          </h3>
          <div className="mt-4 flex items-center gap-1 text-xs font-medium text-amber-500">
            <Clock size={14} />
            <span>{stats && stats.has_active_loan ? `${stats.remaining_tenor} bulan tersisa` : 'Tidak ada pinjaman aktif'}</span>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="glass-card p-6 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <TrendingUp size={80} />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
              <TrendingUp size={20} />
            </div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Estimasi SHU</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats ? stats.estimated_shu_formatted : 'Rp 0'}
          </h3>
          <div className="mt-4 flex items-center gap-1 text-xs font-medium text-emerald-500">
            <CheckCircle2 size={14} />
            <span>15% dari simpanan sukarela</span>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="glass-card p-6 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <AlertCircle size={80} />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
              <AlertCircle size={20} />
            </div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Status Anggota</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats ? stats.member_status : 'Aktif'}</h3>
          <div className="mt-4 flex items-center gap-1 text-xs font-medium text-purple-500">
            <CheckCircle2 size={14} />
            <span>{stats && stats.is_verified ? 'Terverifikasi' : 'Belum Verifikasi'}</span>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Transaction History */}
        <motion.div variants={itemVariants} className="lg:col-span-2 glass-card rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-neutral-700 flex items-center justify-between">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">Riwayat Transaksi Terakhir</h3>
            <button className="text-sm font-bold text-imigrasi-primary dark:text-imigrasi-accent hover:underline">Lihat Semua</button>
          </div>
          <div className="overflow-x-auto">
            {recentTransactions.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <Wallet size={40} className="mx-auto mb-3 opacity-50" />
                <p className="text-sm">Belum ada transaksi terbaru</p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 dark:bg-neutral-800/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                    <th className="px-6 py-4 font-bold">Keterangan</th>
                    <th className="px-6 py-4 font-bold">Tanggal</th>
                    <th className="px-6 py-4 font-bold">Jumlah</th>
                    <th className="px-6 py-4 font-bold">Status</th>
                    <th className="px-6 py-4 font-bold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-neutral-700">
                  {recentTransactions.map((trx) => {
                    const IconComponent = getIconComponent(trx.icon);
                    const isIncome = trx.type === 'saving' || trx.type === 'payroll';
                    return (
                      <tr key={trx.id} className="hover:bg-gray-50 dark:hover:bg-neutral-700/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${isIncome ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'
                              }`}>
                              <IconComponent size={16} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900 dark:text-white">{trx.title}</p>
                              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-mono">{trx.category}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{formatDate(trx.date)}</td>
                        <td className={`px-6 py-4 text-sm font-bold ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                          {isIncome ? '+' : '-'}{formatCurrency(trx.amount)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${trx.status === 'Berhasil' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                            {trx.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="p-2 text-gray-400 hover:text-imigrasi-primary dark:hover:text-imigrasi-accent transition-colors">
                            <Download size={18} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </motion.div>

        {/* Quick Actions & Profile Card */}
        <div className="space-y-8">

          <motion.div variants={itemVariants} className="glass-card rounded-3xl p-6">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">Layanan Online</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setShowLoanModal(true)}
                className="p-4 rounded-2xl bg-imigrasi-primary/5 dark:bg-white/5 border border-imigrasi-primary/10 dark:border-white/10 hover:border-imigrasi-accent transition-all group text-center"
              >
                <div className="w-10 h-10 bg-imigrasi-primary text-white rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <HandCoins size={20} />
                </div>
                <span className="text-xs font-bold text-gray-900 dark:text-white">Ajukan Pinjaman</span>
              </button>
              <button
                onClick={() => setShowWithdrawModal(true)}
                className="p-4 rounded-2xl bg-imigrasi-primary/5 dark:bg-white/5 border border-imigrasi-primary/10 dark:border-white/10 hover:border-imigrasi-accent transition-all group text-center"
              >
                <div className="w-10 h-10 bg-imigrasi-accent text-imigrasi-primary rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <ArrowDownRight size={20} />
                </div>
                <span className="text-xs font-bold text-gray-900 dark:text-white">Tarik Sukarela</span>
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default MemberDashboard;