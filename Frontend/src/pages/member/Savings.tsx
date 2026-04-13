import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wallet, TrendingUp, PieChart, ArrowUpRight, ArrowDownRight, Download, Info, Calendar, RefreshCw, X, CheckCircle2 } from 'lucide-react';
import { DUMMY_SAVINGS, DUMMY_TRANSACTIONS } from '../../constants';
import { useNotifications } from '../../hooks/useNotifications';
import { cn } from '../../lib/utils';

const Savings: React.FC = () => {
  const { addNotification } = useNotifications();
  const [isLoading, setIsLoading] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  const [depositAmount, setDepositAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasUploadedProof, setHasUploadedProof] = useState(false);

  const handleDeposit = async () => {
    if (!depositAmount || !hasUploadedProof) return;
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setShowDepositModal(false);
    setHasUploadedProof(false);
    
    addNotification({
      title: 'Setoran Berhasil',
      message: `Setoran simpanan sukarela sebesar ${formatCurrency(Number(depositAmount))} telah dicatat dan menunggu verifikasi bendahara.`,
      type: 'success'
    });
    
    setDepositAmount('');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const savingsTypes = [
    { label: 'Simpanan Pokok', value: DUMMY_SAVINGS.pokok, icon: Wallet, color: 'bg-blue-500', desc: 'Simpanan awal saat menjadi anggota.' },
    { label: 'Simpanan Wajib', value: DUMMY_SAVINGS.wajib, icon: TrendingUp, color: 'bg-emerald-500', desc: 'Simpanan rutin bulanan anggota.' },
    { label: 'Simpanan Sukarela', value: DUMMY_SAVINGS.sukarela, icon: PieChart, color: 'bg-amber-500', desc: 'Simpanan tambahan yang bisa ditarik.' },
  ];

  const handleRefresh = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsLoading(false);
  };

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
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(DUMMY_SAVINGS.sukarela)}</span>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Jumlah Penarikan (IDR)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Rp</span>
                    <input 
                      type="number" 
                      placeholder="Contoh: 50000" 
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-2xl outline-none transition-all dark:text-white"
                    />
                  </div>
                </div>
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-900/30">
                  <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                    * Penarikan akan diproses dalam 1x24 jam kerja. Dana akan ditransfer ke rekening gaji Anda.
                  </p>
                </div>
                <button className="w-full py-4 bg-imigrasi-primary text-white font-bold rounded-2xl hover:bg-blue-900 transition-all shadow-lg shadow-imigrasi-primary/20">
                  Ajukan Penarikan
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
            <h2 className="text-4xl md:text-5xl font-black">{formatCurrency(DUMMY_SAVINGS.total)}</h2>
            <div className="mt-4 flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <TrendingUp size={18} />
              <span>+ Rp 100.000 bulan ini</span>
            </div>
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
                {DUMMY_TRANSACTIONS.filter(t => t.type === 'Simpanan').map((trx) => (
                  <tr key={trx.id} className="hover:bg-gray-50 dark:hover:bg-neutral-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                          <ArrowUpRight size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">{trx.category}</p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-mono">{trx.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{trx.date}</td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(trx.amount)}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wider">
                        {trx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
