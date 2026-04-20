// src/pages/member/Savings.tsx

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wallet, TrendingUp, PieChart, ArrowUpRight, 
  Download, Info, Calendar, RefreshCw, X, CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { cn } from '../../lib/utils';
import axios from 'axios';

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
  type?: SavingType;
  creator?: { name: string };
}

interface SavingsSummary {
  Pokok: number;
  Wajib: number;
  Sukarela: number;
  total: number;
}

const Savings: React.FC = () => {
  const { addNotification } = useNotifications();
  const [isLoading, setIsLoading] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [selectedSavingType, setSelectedSavingType] = useState<number>(3);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasUploadedProof, setHasUploadedProof] = useState(false);
  
  const [summary, setSummary] = useState<SavingsSummary>({
    Pokok: 0,
    Wajib: 0,
    Sukarela: 0,
    total: 0
  });
  const [transactions, setTransactions] = useState<SavingTransaction[]>([]);
  const [savingTypes, setSavingTypes] = useState<SavingType[]>([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('token');
  const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
    headers: { Authorization: `Bearer ${token}` }
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const userId = user?.id || 1;
      
      // Fix: Gunakan variable yang benar untuk setiap response
      const summaryResponse = await axiosInstance.get(`/savings/summary/${userId}`);
      const transactionsResponse = await axiosInstance.get('/savings');
      const typesResponse = await axiosInstance.get('/saving-types');
      
      // Set data dari response yang sudah ditangkap
      setSummary(summaryResponse.data.data);
      setTransactions(transactionsResponse.data.data);
      setSavingTypes(typesResponse.data.data);
      
    } catch (error: any) {
      console.error('Error fetching savings data:', error);
      addNotification({
        title: 'Gagal Memuat Data',
        message: error.response?.data?.message || 'Terjadi kesalahan saat memuat data simpanan.',
        type: 'error'
      });
      
      // Set default values jika error
      setSummary({ Pokok: 0, Wajib: 0, Sukarela: 0, total: 0 });
      setTransactions([]);
      setSavingTypes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    if (!depositAmount || !hasUploadedProof) return;
    
    setIsSubmitting(true);
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const userId = user?.id || 1;
      
      await axiosInstance.post('/savings', {
        user_id: userId,
        saving_type_id: selectedSavingType,
        amount: Number(depositAmount),
        transaction_type: 'deposit',
        description: 'Setoran simpanan sukarela via dashboard',
        transaction_date: new Date().toISOString().split('T')[0]
      });
      
      await fetchData();
      
      addNotification({
        title: 'Setoran Berhasil',
        message: `Setoran simpanan sukarela sebesar ${formatCurrency(Number(depositAmount))} telah dicatat dan menunggu verifikasi bendahara.`,
        type: 'success'
      });
      
      setShowDepositModal(false);
      setDepositAmount('');
      setHasUploadedProof(false);
    } catch (error: any) {
      addNotification({
        title: 'Setoran Gagal',
        message: error.response?.data?.message || 'Terjadi kesalahan saat melakukan setoran.',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount) return;
    
    setIsSubmitting(true);
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const userId = user?.id || 1;
      
      await axiosInstance.post('/savings', {
        user_id: userId,
        saving_type_id: selectedSavingType,
        amount: Number(withdrawAmount),
        transaction_type: 'withdrawal',
        description: 'Penarikan simpanan sukarela',
        transaction_date: new Date().toISOString().split('T')[0]
      });
      
      await fetchData();
      
      addNotification({
        title: 'Penarikan Berhasil',
        message: `Pengajuan penarikan sebesar ${formatCurrency(Number(withdrawAmount))} telah diproses.`,
        type: 'success'
      });
      
      setShowWithdrawModal(false);
      setWithdrawAmount('');
    } catch (error: any) {
      addNotification({
        title: 'Penarikan Gagal',
        message: error.response?.data?.message || 'Terjadi kesalahan saat melakukan penarikan.',
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

  const handleRefresh = async () => {
    setIsLoading(true);
    await fetchData();
    setIsLoading(false);
  };

  // Pastikan summary memiliki nilai default
  const savingsTypes = [
    { label: 'Simpanan Pokok', value: summary?.Pokok ?? 0, icon: Wallet, color: 'bg-blue-500', desc: 'Simpanan awal saat menjadi anggota. Hanya bisa diambil saat keluar dari keanggotaan.' },
    { label: 'Simpanan Wajib', value: summary?.Wajib ?? 0, icon: TrendingUp, color: 'bg-emerald-500', desc: 'Simpanan rutin bulanan anggota sebesar Rp 100.000.' },
    { label: 'Simpanan Sukarela', value: summary?.Sukarela ?? 0, icon: PieChart, color: 'bg-amber-500', desc: 'Simpanan tambahan yang bisa ditarik sewaktu-waktu.' },
  ];

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
              onClick={() => setShowDepositModal(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-neutral-800 rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 dark:border-neutral-700 flex items-center justify-between bg-emerald-500 text-white">
                <h3 className="font-bold text-xl">Setor Simpanan Sukarela</h3>
                <button onClick={() => setShowDepositModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Jenis Simpanan</label>
                  <select 
                    value={selectedSavingType}
                    onChange={(e) => setSelectedSavingType(Number(e.target.value))}
                    className="w-full px-4 py-4 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-2xl outline-none transition-all dark:text-white"
                  >
                    {savingTypes.filter(t => t.name === 'Sukarela').map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Jumlah Setoran (IDR)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Rp</span>
                    <input 
                      type="number" 
                      placeholder="Contoh: 100000" 
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-2xl outline-none transition-all dark:text-white"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Upload Bukti Transfer</label>
                    <div 
                      onClick={() => setHasUploadedProof(true)}
                      className={cn(
                        "w-full p-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all",
                        hasUploadedProof 
                        ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 text-emerald-600" 
                        : "bg-gray-50 dark:bg-neutral-700 border-gray-200 dark:border-neutral-600 text-gray-400 hover:border-imigrasi-accent hover:text-imigrasi-primary"
                      )}
                    >
                      {hasUploadedProof ? (
                        <>
                          <CheckCircle2 size={32} />
                          <span className="text-xs font-bold">Bukti Transfer Berhasil Diunggah</span>
                        </>
                      ) : (
                        <>
                          <ArrowUpRight size={32} />
                          <span className="text-xs font-bold">Klik untuk Unggah Bukti Transfer</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                  <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                    * Setoran simpanan sukarela memerlukan verifikasi manual oleh bendahara setelah bukti transfer diunggah.
                  </p>
                </div>
                <button 
                  onClick={handleDeposit}
                  disabled={isSubmitting || !depositAmount || !hasUploadedProof}
                  className="w-full py-4 bg-imigrasi-primary text-white font-bold rounded-2xl hover:bg-blue-900 transition-all shadow-lg shadow-imigrasi-primary/20 disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {isSubmitting && <RefreshCw size={18} className="animate-spin" />}
                  {isSubmitting ? 'Memproses...' : 'Konfirmasi Setoran'}
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
              className="relative w-full max-w-lg bg-white dark:bg-neutral-800 rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 dark:border-neutral-700 flex items-center justify-between bg-amber-500 text-white">
                <h3 className="font-bold text-xl">Tarik Simpanan Sukarela</h3>
                <button onClick={() => setShowWithdrawModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="p-4 bg-gray-50 dark:bg-neutral-700/30 rounded-2xl flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-500 uppercase">Saldo Tersedia</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(summary?.Sukarela ?? 0)}</span>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Jumlah Penarikan (IDR)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Rp</span>
                    <input 
                      type="number" 
                      placeholder="Contoh: 50000" 
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-2xl outline-none transition-all dark:text-white"
                    />
                  </div>
                </div>
                {Number(withdrawAmount) > (summary?.Sukarela ?? 0) && withdrawAmount && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800 flex gap-3">
                    <AlertCircle size={20} className="text-red-600 shrink-0" />
                    <p className="text-xs text-red-700 dark:text-red-400">Jumlah penarikan melebihi saldo yang tersedia.</p>
                  </div>
                )}
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-900/30">
                  <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                    * Penarikan akan diproses dalam 1x24 jam kerja. Dana akan ditransfer ke rekening gaji Anda.
                  </p>
                </div>
                <button 
                  onClick={handleWithdraw}
                  disabled={isSubmitting || !withdrawAmount || Number(withdrawAmount) > (summary?.Sukarela ?? 0)}
                  className="w-full py-4 bg-imigrasi-primary text-white font-bold rounded-2xl hover:bg-blue-900 transition-all shadow-lg shadow-imigrasi-primary/20 disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {isSubmitting && <RefreshCw size={18} className="animate-spin" />}
                  {isSubmitting ? 'Memproses...' : 'Ajukan Penarikan'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Simpanan Saya</h1>
          <p className="text-gray-500 dark:text-gray-400">Kelola dan pantau pertumbuhan modal Anda di Koperasi.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleRefresh}
            className="p-3 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-500 hover:text-imigrasi-primary transition-colors"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <button className="flex items-center gap-2 px-6 py-2 bg-imigrasi-primary text-white rounded-xl text-sm font-bold hover:bg-blue-900 transition-colors shadow-lg shadow-imigrasi-primary/20">
            <Download size={18} />
            Laporan Simpanan
          </button>
        </div>
      </div>

      {/* Total Balance Card */}
      <div className="glass-card p-8 rounded-[2.5rem] bg-gradient-to-br from-imigrasi-primary to-blue-900 text-white border-none relative overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <p className="text-white/60 text-sm font-bold uppercase tracking-widest mb-2">Total Saldo Simpanan</p>
            <h2 className="text-4xl md:text-5xl font-black">{formatCurrency(summary?.total ?? 0)}</h2>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => setShowWithdrawModal(true)}
              className="flex-1 md:flex-none px-6 py-3 bg-white text-imigrasi-primary font-bold rounded-2xl hover:bg-imigrasi-accent transition-colors"
            >
              Tarik Sukarela
            </button>
            <button 
              onClick={() => setShowDepositModal(true)}
              className="flex-1 md:flex-none px-6 py-3 bg-white/10 text-white font-bold rounded-2xl hover:bg-white/20 transition-colors border border-white/20"
            >
              Setor Sukarela
            </button>
          </div>
        </div>
      </div>

      {/* Savings Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {savingsTypes.map((type) => (
          <div key={type.label} className="glass-card p-6 rounded-3xl group hover:border-imigrasi-accent transition-all">
            <div className="flex items-center justify-between mb-6">
              <div className={`p-3 ${type.color} text-white rounded-2xl shadow-lg group-hover:scale-110 transition-transform`}>
                <type.icon size={24} />
              </div>
              <Info size={18} className="text-gray-300 cursor-help" />
            </div>
            <h4 className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">{type.label}</h4>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{formatCurrency(type.value)}</p>
            <p className="text-xs text-gray-400 leading-relaxed">{type.desc}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Transaction History */}
        <div className="lg:col-span-2 glass-card rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-neutral-700 flex items-center justify-between">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">Aktivitas Simpanan</h3>
            <div className="flex items-center gap-2">
              <button className="p-2 bg-gray-100 dark:bg-neutral-700 rounded-xl text-gray-500">
                <Calendar size={18} />
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            {transactions.length === 0 ? (
              <div className="p-12 text-center">
                <Wallet size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">Belum ada aktivitas simpanan</p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 dark:bg-neutral-800/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                    <th className="px-6 py-4 font-bold">Keterangan</th>
                    <th className="px-6 py-4 font-bold">Tanggal</th>
                    <th className="px-6 py-4 font-bold">Jumlah</th>
                    <th className="px-6 py-4 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-neutral-700">
                  {transactions.map((trx) => (
                    <tr key={trx.id} className="hover:bg-gray-50 dark:hover:bg-neutral-700/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            trx.transaction_type === 'deposit' 
                              ? 'bg-green-100 text-green-600' 
                              : 'bg-amber-100 text-amber-600'
                          }`}>
                            {trx.transaction_type === 'deposit' 
                              ? <ArrowUpRight size={16} /> 
                              : <ArrowDownRight size={16} />
                            }
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                              {trx.transaction_type === 'deposit' ? 'Setoran' : 'Penarikan'} {trx.type?.name || 'Simpanan'}
                            </p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-mono">
                              {trx.description || `Transaksi ${trx.transaction_type === 'deposit' ? 'setoran' : 'penarikan'}`}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {new Date(trx.transaction_date).toLocaleDateString('id-ID')}
                      </td>
                      <td className={`px-6 py-4 text-sm font-bold ${
                        trx.transaction_type === 'deposit' 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {trx.transaction_type === 'deposit' ? '+' : '-'}{formatCurrency(trx.amount)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wider">
                          Berhasil
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Info Sidebar */}
        <div className="space-y-8">
          <div className="glass-card p-6 rounded-3xl bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30">
            <h4 className="font-bold text-blue-900 dark:text-blue-400 mb-4">Ketentuan Simpanan</h4>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <div className="shrink-0 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold">1</div>
                <p className="text-xs text-blue-800 dark:text-blue-500/80 leading-relaxed">Simpanan Wajib dipotong otomatis dari gaji setiap bulan sebesar Rp 100.000.</p>
              </li>
              <li className="flex gap-3">
                <div className="shrink-0 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold">2</div>
                <p className="text-xs text-blue-800 dark:text-blue-500/80 leading-relaxed">Simpanan Sukarela dapat ditarik sewaktu-waktu melalui pengajuan di dashboard.</p>
              </li>
              <li className="flex gap-3">
                <div className="shrink-0 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold">3</div>
                <p className="text-xs text-blue-800 dark:text-blue-500/80 leading-relaxed">Simpanan Pokok & Wajib hanya dapat diambil saat keluar dari keanggotaan koperasi.</p>
              </li>
            </ul>
          </div>

          <div className="glass-card p-6 rounded-3xl text-center space-y-4">
            <div className="w-16 h-16 bg-imigrasi-accent/10 rounded-2xl flex items-center justify-center mx-auto">
              <TrendingUp size={32} className="text-imigrasi-accent" />
            </div>
            <h4 className="font-bold text-gray-900 dark:text-white">Partisipasi Modal</h4>
            <p className="text-xs text-gray-500 leading-relaxed">Semakin besar simpanan Anda, semakin besar potensi Sisa Hasil Usaha (SHU) yang akan Anda terima di akhir tahun buku.</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Savings;