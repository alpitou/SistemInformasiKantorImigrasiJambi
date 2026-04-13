import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wallet, 
  TrendingUp, 
  HandCoins, 
  ArrowUpRight, 
  ArrowDownRight, 
  RefreshCw, 
  PieChart, 
  Calculator, 
  CheckCircle2, 
  AlertCircle,
  X,
  Save,
  Download,
  Settings
} from 'lucide-react';

const FinancialManagement: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showSHUModal, setShowSHUModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [shuStep, setShuStep] = useState(1);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleCalculateSHU = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setShuStep(2);
    setIsLoading(false);
  };

  const handleDistributeSHU = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setShuStep(3);
    setIsLoading(false);
  };

  const handleBackup = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsLoading(false);
    setShowBackupModal(false);
    alert('Database berhasil di-backup dan diunduh.');
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* SHU Process Modal */}
      <AnimatePresence>
        {showSHUModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowSHUModal(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-neutral-800 rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 dark:border-neutral-700 flex items-center justify-between bg-imigrasi-primary text-white">
                <h3 className="font-bold text-xl">Proses Perhitungan SHU</h3>
                <button onClick={() => setShowSHUModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-8 space-y-8">
                {/* Stepper */}
                <div className="flex items-center justify-between relative">
                  <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 dark:bg-neutral-700 -translate-y-1/2 z-0" />
                  {[1, 2, 3].map((step) => (
                    <div key={step} className={cn("relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all", 
                      shuStep >= step ? "bg-imigrasi-primary text-white scale-110" : "bg-gray-100 dark:bg-neutral-700 text-gray-400")}>
                      {shuStep > step ? <CheckCircle2 size={20} /> : step}
                    </div>
                  ))}
                </div>

                {shuStep === 1 && (
                  <div className="space-y-6 text-center">
                    <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-3xl flex items-center justify-center mx-auto">
                      <Calculator size={40} className="text-imigrasi-primary" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-gray-900 dark:text-white">Siap Menghitung SHU?</h4>
                      <p className="text-sm text-gray-500 mt-2">Sistem akan mengumpulkan data simpanan dan pinjaman anggota untuk periode tahun buku 2025.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-neutral-700/30 rounded-2xl">
                      <div className="text-left">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tahun Buku</p>
                        <p className="font-bold text-gray-900 dark:text-white">2025</p>
                      </div>
                      <div className="text-left">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Anggota</p>
                        <p className="font-bold text-gray-900 dark:text-white">245 Orang</p>
                      </div>
                    </div>
                    <button 
                      onClick={handleCalculateSHU}
                      disabled={isLoading}
                      className="w-full py-4 bg-imigrasi-primary text-white font-bold rounded-2xl hover:bg-blue-900 transition-all shadow-lg shadow-imigrasi-primary/20 flex items-center justify-center gap-2"
                    >
                      {isLoading ? <RefreshCw className="animate-spin" size={20} /> : 'Mulai Perhitungan'}
                    </button>
                  </div>
                )}

                {shuStep === 2 && (
                  <div className="space-y-6">
                    <div className="p-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-3xl border border-emerald-100 dark:border-emerald-900/30">
                      <h4 className="font-bold text-emerald-900 dark:text-emerald-400 mb-4">Hasil Perhitungan Sementara</h4>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-emerald-800 dark:text-emerald-500/80">Total SHU Bersih</span>
                          <span className="text-lg font-bold text-emerald-900 dark:text-emerald-300">{formatCurrency(250000000)}</span>
                        </div>
                        <div className="h-px bg-emerald-200 dark:bg-emerald-800" />
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[10px] font-bold text-emerald-700/60 uppercase">Jasa Modal (40%)</p>
                            <p className="font-bold text-emerald-900 dark:text-emerald-300">{formatCurrency(100000000)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-emerald-700/60 uppercase">Jasa Anggota (60%)</p>
                            <p className="font-bold text-emerald-900 dark:text-emerald-300">{formatCurrency(150000000)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-900/30 flex gap-3">
                      <AlertCircle size={20} className="text-amber-600 shrink-0" />
                      <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                        Setelah didistribusikan, saldo SHU akan otomatis masuk ke Simpanan Sukarela masing-masing anggota. Tindakan ini tidak dapat dibatalkan.
                      </p>
                    </div>
                    <div className="flex gap-4">
                      <button onClick={() => setShuStep(1)} className="flex-1 py-4 bg-gray-100 dark:bg-neutral-700 text-gray-600 dark:text-gray-300 font-bold rounded-2xl hover:bg-gray-200 transition-all">
                        Ulangi
                      </button>
                      <button 
                        onClick={handleDistributeSHU}
                        disabled={isLoading}
                        className="flex-1 py-4 bg-imigrasi-primary text-white font-bold rounded-2xl hover:bg-blue-900 transition-all shadow-lg shadow-imigrasi-primary/20 flex items-center justify-center gap-2"
                      >
                        {isLoading ? <RefreshCw className="animate-spin" size={20} /> : 'Distribusikan SHU'}
                      </button>
                    </div>
                  </div>
                )}

                {shuStep === 3 && (
                  <div className="space-y-6 text-center">
                    <div className="w-20 h-20 bg-emerald-500 text-white rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                      <CheckCircle2 size={40} />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-gray-900 dark:text-white">SHU Berhasil Didistribusikan!</h4>
                      <p className="text-sm text-gray-500 mt-2">Seluruh anggota telah menerima bagian SHU mereka di saldo simpanan sukarela.</p>
                    </div>
                    <button 
                      onClick={() => setShowSHUModal(false)}
                      className="w-full py-4 bg-imigrasi-primary text-white font-bold rounded-2xl hover:bg-blue-900 transition-all"
                    >
                      Selesai
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Backup Database Modal */}
      <AnimatePresence>
        {showBackupModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowBackupModal(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-neutral-800 rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 dark:border-neutral-700 flex items-center justify-between bg-purple-600 text-white">
                <h3 className="font-bold text-xl">Backup Database</h3>
                <button onClick={() => setShowBackupModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-8 space-y-6 text-center">
                <div className="w-20 h-20 bg-purple-50 dark:bg-purple-900/20 rounded-3xl flex items-center justify-center mx-auto">
                  <Save size={40} className="text-purple-600" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white">Amankan Data Anda</h4>
                  <p className="text-sm text-gray-500 mt-2">Sistem akan membuat salinan lengkap database saat ini dalam format .sql atau .json.</p>
                </div>
                <button 
                  onClick={handleBackup}
                  disabled={isLoading}
                  className="w-full py-4 bg-purple-600 text-white font-bold rounded-2xl hover:bg-purple-700 transition-all shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2"
                >
                  {isLoading ? <RefreshCw className="animate-spin" size={20} /> : <Download size={20} />}
                  {isLoading ? 'Memproses...' : 'Mulai Backup & Download'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manajemen Keuangan</h1>
          <p className="text-gray-500 dark:text-gray-400">Pantau arus kas, kelola simpanan, pinjaman, dan proses pembagian SHU.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowSHUModal(true)}
            className="flex items-center gap-2 px-6 py-2 bg-imigrasi-accent text-imigrasi-primary rounded-xl text-sm font-bold hover:bg-white transition-colors shadow-lg shadow-imigrasi-accent/20"
          >
            <PieChart size={18} />
            Proses SHU
          </button>
          <button className="flex items-center gap-2 px-6 py-2 bg-imigrasi-primary text-white rounded-xl text-sm font-bold hover:bg-blue-900 transition-colors shadow-lg shadow-imigrasi-primary/20">
            <Download size={18} />
            Export Laporan
          </button>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Wallet size={80} />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
              <Wallet size={20} />
            </div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Kas Koperasi</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(1500000000)}</h3>
          <div className="mt-4 flex items-center gap-1 text-xs font-medium text-green-500">
            <ArrowUpRight size={14} />
            <span>+Rp 45.000.000 bulan ini</span>
          </div>
        </div>

        <div className="glass-card p-6 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <HandCoins size={80} />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
              <HandCoins size={20} />
            </div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Piutang Pinjaman</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(450000000)}</h3>
          <div className="mt-4 flex items-center gap-1 text-xs font-medium text-amber-500">
            <AlertCircle size={14} />
            <span>12 pinjaman aktif</span>
          </div>
        </div>

        <div className="glass-card p-6 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <TrendingUp size={80} />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
              <TrendingUp size={20} />
            </div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Laba Berjalan (SHU)</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(250000000)}</h3>
          <div className="mt-4 flex items-center gap-1 text-xs font-medium text-emerald-500">
            <CheckCircle2 size={14} />
            <span>Periode 2025</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Transactions */}
        <div className="lg:col-span-2 glass-card rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-neutral-700 flex items-center justify-between">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">Transaksi Keuangan Terakhir</h3>
            <button className="text-xs font-bold text-imigrasi-primary dark:text-imigrasi-accent hover:underline">Lihat Semua</button>
          </div>
          <div className="overflow-x-auto">
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
                {[1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-neutral-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${i % 2 === 0 ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                          {i % 2 === 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">{i % 2 === 0 ? 'Simpanan Wajib' : 'Angsuran Pinjaman'}</p>
                          <p className="text-[10px] text-gray-500 font-mono">TRX-2025-{i}00</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">0{i} April 2026</td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(i * 100000)}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wider">Berhasil</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-8">
          <div className="glass-card p-6 rounded-3xl space-y-4">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">Konfigurasi Keuangan</h3>
            <button 
              onClick={() => setShowBackupModal(true)}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-neutral-700/30 hover:bg-gray-100 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg group-hover:scale-110 transition-transform"><Save size={18} /></div>
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Backup Database</span>
              </div>
              <ArrowUpRight size={16} className="text-gray-400" />
            </button>
          </div>

          <div className="glass-card p-6 rounded-3xl bg-imigrasi-primary text-white border-none shadow-xl shadow-imigrasi-primary/20">
            <h4 className="font-bold mb-2 text-imigrasi-accent">Target Keuangan 2026</h4>
            <p className="text-xs text-white/90 mb-4 font-medium">Pencapaian target simpanan anggota tahun ini.</p>
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold text-imigrasi-accent">
                <span>Rp 1.5M / Rp 2M</span>
                <span>75%</span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-imigrasi-accent w-3/4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const cn = (...inputs: any[]) => inputs.filter(Boolean).join(' ');

export default FinancialManagement;
