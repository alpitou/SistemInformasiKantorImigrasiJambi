import React from 'react';
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
  X
} from 'lucide-react';
import { 
  DUMMY_SAVINGS, 
  DUMMY_LOANS, 
  DUMMY_TRANSACTIONS, 
  DUMMY_USER 
} from '../../constants';

const MemberDashboard: React.FC = () => {
  const activeLoan = DUMMY_LOANS.find(l => l.status === 'Active');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  const [showLoanModal, setShowLoanModal] = React.useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = React.useState(false);

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
                    className="w-full p-4 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-2xl outline-none transition-all dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Tenor (Bulan)</label>
                  <select className="w-full p-4 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-2xl outline-none transition-all dark:text-white">
                    <option>6 Bulan</option>
                    <option>12 Bulan</option>
                    <option>24 Bulan</option>
                  </select>
                </div>
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-900/30">
                  <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                    * Pengajuan akan diverifikasi oleh Bendahara dan Ketua Koperasi. Pastikan data yang Anda masukkan benar.
                  </p>
                </div>
                <button className="w-full py-4 bg-imigrasi-primary text-white font-bold rounded-2xl hover:bg-blue-900 transition-all shadow-lg shadow-imigrasi-primary/20">
                  Kirim Pengajuan
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
                    <span className="text-sm font-bold text-blue-900 dark:text-blue-300">{formatCurrency(DUMMY_SAVINGS.sukarela)}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Jumlah Penarikan (IDR)</label>
                  <input 
                    type="number" 
                    placeholder="Contoh: 100000" 
                    className="w-full p-4 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-2xl outline-none transition-all dark:text-white"
                  />
                </div>
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-900/30">
                  <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                    * Penarikan simpanan sukarela akan diproses dalam 1x24 jam hari kerja. Dana akan ditransfer ke rekening gaji Anda.
                  </p>
                </div>
                <button className="w-full py-4 bg-imigrasi-primary text-white font-bold rounded-2xl hover:bg-blue-900 transition-all shadow-lg shadow-imigrasi-primary/20">
                  Kirim Permohonan
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
        <div className="flex items-center gap-2 bg-imigrasi-primary/5 dark:bg-white/5 px-4 py-2 rounded-xl border border-imigrasi-primary/10 dark:border-white/10">
          <Calendar className="text-imigrasi-primary dark:text-imigrasi-accent" size={18} />
          <span className="text-sm font-medium text-imigrasi-primary dark:text-white">
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
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
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(DUMMY_SAVINGS.total)}</h3>
          <div className="mt-4 flex items-center gap-1 text-xs font-medium text-green-500">
            <ArrowUpRight size={14} />
            <span>+2.5% dari bulan lalu</span>
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
            {activeLoan ? formatCurrency(activeLoan.remaining) : 'Rp 0'}
          </h3>
          <div className="mt-4 flex items-center gap-1 text-xs font-medium text-amber-500">
            <Clock size={14} />
            <span>{activeLoan ? `${activeLoan.tenor - activeLoan.paidInstallments} bulan tersisa` : 'Tidak ada pinjaman aktif'}</span>
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
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(1250000)}</h3>
          <div className="mt-4 flex items-center gap-1 text-xs font-medium text-emerald-500">
            <CheckCircle2 size={14} />
            <span>Periode 2025/2026</span>
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
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{DUMMY_USER.status}</h3>
          <div className="mt-4 flex items-center gap-1 text-xs font-medium text-purple-500">
            <CheckCircle2 size={14} />
            <span>Terverifikasi</span>
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
                {DUMMY_TRANSACTIONS.map((trx) => (
                  <tr key={trx.id} className="hover:bg-gray-50 dark:hover:bg-neutral-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          trx.type === 'Simpanan' ? 'bg-green-100 text-green-600' : 
                          trx.type === 'Pinjaman' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {trx.type === 'Simpanan' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">{trx.type} {trx.category}</p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-mono">{trx.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{trx.date}</td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(trx.amount)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        trx.status === 'Success' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
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
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Quick Actions & Profile Card */}
        <div className="space-y-8">
          <motion.div variants={itemVariants} className="glass-card rounded-3xl p-6 bg-gradient-to-br from-imigrasi-primary to-blue-900 text-white border-none shadow-imigrasi-primary/20">
            <div className="flex items-center gap-4 mb-6">
              <img src={DUMMY_USER.avatar} alt="" className="w-16 h-16 rounded-2xl border-2 border-white/20" />
              <div>
                <h4 className="font-bold text-lg">{DUMMY_USER.name}</h4>
                <p className="text-xs text-white/60 font-mono">{DUMMY_USER.nip}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Unit Kerja</span>
                <span className="font-medium text-right">{DUMMY_USER.unitKerja}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/60">ID Anggota</span>
                <span className="font-mono font-bold text-imigrasi-accent">{DUMMY_USER.id}</span>
              </div>
            </div>
          </motion.div>

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
