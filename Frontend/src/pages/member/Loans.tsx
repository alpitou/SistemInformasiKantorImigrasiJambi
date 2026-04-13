import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HandCoins, TrendingUp, PieChart, ArrowUpRight, ArrowDownRight, Download, Info, Calendar, RefreshCw, CheckCircle2, Clock, AlertCircle, X, Eye } from 'lucide-react';
import { DUMMY_LOANS, DUMMY_TRANSACTIONS } from '../../constants';
import { cn } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';

const Loans: React.FC = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [isLoading, setIsLoading] = useState(false);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [loanStep, setLoanStep] = useState(1);
  const [loanAmount, setLoanAmount] = useState('');
  const [loanTenor, setLoanTenor] = useState('12');
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const [hasUploaded, setHasUploaded] = useState(false);
  
  const activeLoan = DUMMY_LOANS.find(l => l.status === 'Active');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsLoading(false);
  };

  const handleDownload = () => {
    setHasDownloaded(true);
    // Simulate download
    const link = document.createElement('a');
    link.href = '#';
    link.download = 'Surat_Perjanjian_Pinjaman.pdf';
    link.click();
    addNotification({
      title: 'Dokumen Diunduh',
      message: 'Silakan cetak, tanda tangani di atas materai, dan unggah kembali.',
      type: 'info'
    });
  };

  const handleUpload = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setHasUploaded(true);
      addNotification({
        title: 'Dokumen Diunggah',
        message: 'Dokumen berhasil diunggah. Silakan lanjutkan pengajuan.',
        type: 'success'
      });
    }, 1500);
  };

  const handleSubmitLoan = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsLoading(false);
    setShowLoanModal(false);
    setLoanStep(1);
    setHasDownloaded(false);
    setHasUploaded(false);
    addNotification({
      title: 'Pengajuan Terkirim',
      message: 'Pengajuan pinjaman Anda telah dikirim dan menunggu verifikasi Bendahara.',
      type: 'info'
    });
  };

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
                setLoanStep(1);
              }}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-neutral-800 rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 dark:border-neutral-700 flex items-center justify-between bg-imigrasi-primary text-white">
                <h3 className="font-bold text-xl">
                  {loanStep === 1 ? 'Pengajuan Pinjaman' : 'Pratinjau Dokumen Persetujuan'}
                </h3>
                <button onClick={() => {
                  setShowLoanModal(false);
                  setLoanStep(1);
                }} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-8 space-y-6 max-h-[80vh] overflow-y-auto">
                {loanStep === 1 ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Jumlah Pinjaman (IDR)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Rp</span>
                        <input 
                          type="number" 
                          value={loanAmount}
                          onChange={(e) => setLoanAmount(e.target.value)}
                          placeholder="Contoh: 5000000" 
                          className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-2xl outline-none transition-all dark:text-white"
                        />
                      </div>
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
                      <div className="flex gap-3">
                        <Info size={18} className="text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                          * Pengajuan akan diverifikasi oleh Bendahara dan Ketua Koperasi. Suku bunga 1% flat per bulan.
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setLoanStep(2)}
                      disabled={!loanAmount}
                      className="w-full py-4 bg-imigrasi-primary text-white font-bold rounded-2xl hover:bg-blue-900 transition-all shadow-lg shadow-imigrasi-primary/20 disabled:opacity-50"
                    >
                      Lanjut ke Dokumen
                    </button>
                  </>
                ) : (
                  <div className="space-y-6">
                    {/* Document Preview */}
                    <div className="p-8 bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl shadow-inner font-serif text-sm leading-relaxed text-gray-800 dark:text-gray-300">
                      <div className="text-center mb-8">
                        <h4 className="font-bold text-lg underline uppercase">Surat Perjanjian Pinjaman</h4>
                        <p className="text-xs mt-1">Nomor: PJ/{new Date().getFullYear()}/{Math.floor(Math.random() * 1000).toString().padStart(3, '0')}</p>
                      </div>
                      
                      <p className="mb-4">Saya yang bertanda tangan di bawah ini:</p>
                      <div className="ml-4 space-y-1 mb-6">
                        <div className="grid grid-cols-3">
                          <span className="font-bold">Nama</span>
                          <span className="col-span-2">: {user?.name}</span>
                        </div>
                        <div className="grid grid-cols-3">
                          <span className="font-bold">NIP / NIK</span>
                          <span className="col-span-2">: {user?.nip}</span>
                        </div>
                        <div className="grid grid-cols-3">
                          <span className="font-bold">Seksi / Bagian</span>
                          <span className="col-span-2">: {user?.unitKerja}</span>
                        </div>
                        <div className="grid grid-cols-3">
                          <span className="font-bold">No. Telepon</span>
                          <span className="col-span-2">: {user?.phone || '0812-XXXX-XXXX'}</span>
                        </div>
                        <div className="grid grid-cols-3">
                          <span className="font-bold">No. Rekening</span>
                          <span className="col-span-2">: BRI - {user?.bankAccountNumber || 'XXXX-XXXX-XXXX'}</span>
                        </div>
                      </div>
                      
                      <p className="mb-4">
                        Dengan ini mengajukan pinjaman kepada Koperasi Kantor Imigrasi Jambi sebesar 
                        <span className="font-bold mx-1">{formatCurrency(Number(loanAmount))}</span> 
                        dengan jangka waktu pengembalian selama <span className="font-bold mx-1">{loanTenor} bulan</span>.
                      </p>
                      
                      <p className="mb-8">
                        Saya bersedia mematuhi segala peraturan yang berlaku di Koperasi dan memberikan kuasa kepada Bendahara Gaji untuk melakukan pemotongan gaji setiap bulan sebagai angsuran pinjaman tersebut.
                      </p>
                      
                      <div className="flex justify-between items-end mt-12">
                        <div className="text-center">
                          <p className="mb-16">Mengetahui,<br/>Ketua Koperasi</p>
                          <p className="font-bold">( Drs. M. Yusuf )</p>
                        </div>
                        <div className="text-center relative">
                          <p className="mb-16">Jambi, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br/>Peminjam,</p>
                          
                          {/* Materai Placeholder */}
                          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-14 border-2 border-dashed border-blue-400 bg-blue-50/50 flex items-center justify-center rotate-[-5deg] opacity-60">
                            <span className="text-[8px] font-bold text-blue-500 uppercase text-center leading-tight">Materai<br/>Rp 10.000</span>
                          </div>
                          
                          <p className="font-bold underline">{user?.name}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {!hasDownloaded ? (
                        <button 
                          onClick={handleDownload}
                          className="w-full py-4 bg-imigrasi-accent text-imigrasi-primary font-bold rounded-2xl hover:bg-white transition-all shadow-lg flex items-center justify-center gap-2"
                        >
                          <Download size={20} />
                          Unduh Surat Perjanjian
                        </button>
                      ) : !hasUploaded ? (
                        <div className="space-y-4">
                          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-900/30 flex items-center gap-3">
                            <CheckCircle2 className="text-blue-600" size={20} />
                            <p className="text-xs text-blue-800 dark:text-blue-400 font-bold">Dokumen telah diunduh. Silakan unggah hasil scan yang sudah ditandatangani.</p>
                          </div>
                          <button 
                            onClick={handleUpload}
                            disabled={isLoading}
                            className="w-full py-4 bg-imigrasi-primary text-white font-bold rounded-2xl hover:bg-blue-900 transition-all shadow-lg flex items-center justify-center gap-2"
                          >
                            {isLoading ? <RefreshCw className="animate-spin" size={20} /> : <ArrowUpRight size={20} />}
                            Unggah Dokumen (Scan/Foto)
                          </button>
                        </div>
                      ) : (
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-100 dark:border-green-900/30 flex items-center gap-3">
                          <CheckCircle2 className="text-green-600" size={20} />
                          <p className="text-xs text-green-800 dark:text-green-400 font-bold">Dokumen berhasil diverifikasi. Anda dapat mengirim pengajuan sekarang.</p>
                        </div>
                      )}

                      <div className="flex gap-4">
                        <button 
                          onClick={() => {
                            setLoanStep(1);
                            setHasDownloaded(false);
                            setHasUploaded(false);
                          }}
                          className="flex-1 py-4 bg-gray-100 dark:bg-neutral-700 text-gray-600 dark:text-gray-300 font-bold rounded-2xl hover:bg-gray-200 transition-all"
                        >
                          Kembali
                        </button>
                        <button 
                          onClick={handleSubmitLoan}
                          disabled={isLoading || !hasUploaded}
                          className="flex-1 py-4 bg-imigrasi-primary text-white font-bold rounded-2xl hover:bg-blue-900 transition-all shadow-lg shadow-imigrasi-primary/20 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {isLoading ? <RefreshCw className="animate-spin" size={20} /> : 'Kirim Pengajuan'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Installment Schedule Modal */}
      <AnimatePresence>
        {showScheduleModal && activeLoan && (
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
              className="relative w-full max-w-2xl bg-white dark:bg-neutral-800 rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 dark:border-neutral-700 flex items-center justify-between bg-imigrasi-primary text-white">
                <h3 className="font-bold text-xl">Jadwal Angsuran</h3>
                <button onClick={() => setShowScheduleModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-8 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="p-4 bg-gray-50 dark:bg-neutral-700/50 rounded-2xl">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">ID Pinjaman</p>
                    <p className="font-mono font-bold text-gray-900 dark:text-white">{activeLoan.id}</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-neutral-700/50 rounded-2xl">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Angsuran / Bln</p>
                    <p className="font-bold text-gray-900 dark:text-white">{formatCurrency(activeLoan.amount / activeLoan.tenor)}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="grid grid-cols-4 px-4 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    <span>Bulan Ke</span>
                    <span>Tanggal</span>
                    <span>Angsuran</span>
                    <span className="text-right">Status</span>
                  </div>
                  {Array.from({ length: activeLoan.tenor }).map((_, i) => {
                    const isPaid = i < activeLoan.paidInstallments;
                    return (
                      <div 
                        key={i} 
                        className={cn(
                          "grid grid-cols-4 px-4 py-4 rounded-2xl text-sm transition-colors",
                          isPaid ? "bg-emerald-50 dark:bg-emerald-900/10" : "bg-gray-50 dark:bg-neutral-700/30"
                        )}
                      >
                        <span className="font-bold text-gray-900 dark:text-white">{i + 1}</span>
                        <span className="text-gray-500 dark:text-gray-400">
                          {new Date(2026, 3 + i, 15).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(activeLoan.amount / activeLoan.tenor)}</span>
                        <div className="text-right">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider",
                            isPaid ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                          )}>
                            {isPaid ? 'Lunas' : 'Belum'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pinjaman Saya</h1>
          <p className="text-gray-500 dark:text-gray-400">Pantau status pinjaman, angsuran, dan ajukan pinjaman baru.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleRefresh}
            className="p-3 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-500 hover:text-imigrasi-primary transition-colors"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={() => setShowLoanModal(true)}
            className="flex items-center gap-2 px-6 py-2 bg-imigrasi-primary text-white rounded-xl text-sm font-bold hover:bg-blue-900 transition-colors shadow-lg shadow-imigrasi-primary/20"
          >
            Ajukan Pinjaman
          </button>
        </div>
      </div>

      {/* Active Loan Card */}
      {activeLoan ? (
        <div className="glass-card p-8 rounded-[2.5rem] bg-gradient-to-br from-imigrasi-primary to-blue-900 text-white border-none relative overflow-hidden">
          <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center gap-3">
                <div className="px-3 py-1 bg-emerald-500 text-white rounded-full text-[10px] font-bold uppercase tracking-wider">Lancar</div>
                <span className="text-xs text-white/60 font-mono">{activeLoan.id}</span>
              </div>
              <div>
                <p className="text-white/60 text-sm font-bold uppercase tracking-widest mb-2">Sisa Pinjaman</p>
                <h2 className="text-4xl md:text-5xl font-black">{formatCurrency(activeLoan.remaining)}</h2>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span>Progres Angsuran</span>
                  <span>{activeLoan.paidInstallments} / {activeLoan.tenor} Bulan</span>
                </div>
                <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(activeLoan.paidInstallments / activeLoan.tenor) * 100}%` }}
                    className="h-full bg-imigrasi-accent"
                  />
                </div>
              </div>
            </div>
            <div className="bg-white/5 rounded-3xl p-6 border border-white/10 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Total Pinjaman</span>
                <span className="font-bold">{formatCurrency(activeLoan.amount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Jatuh Tempo</span>
                <span className="font-bold">{activeLoan.dueDate}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Angsuran / Bln</span>
                <span className="font-bold">{formatCurrency(activeLoan.amount / activeLoan.tenor)}</span>
              </div>
              <button 
                onClick={() => setShowScheduleModal(true)}
                className="w-full py-3 bg-imigrasi-accent text-imigrasi-primary font-bold rounded-xl hover:bg-white transition-colors text-xs"
              >
                Lihat Jadwal Angsuran
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-card p-12 rounded-[2.5rem] text-center space-y-6">
          <div className="w-20 h-20 bg-gray-100 dark:bg-neutral-700 rounded-3xl flex items-center justify-center mx-auto">
            <HandCoins size={40} className="text-gray-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Tidak Ada Pinjaman Aktif</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Anda tidak memiliki pinjaman yang sedang berjalan saat ini.</p>
          </div>
          <button 
            onClick={() => setShowLoanModal(true)}
            className="px-8 py-3 bg-imigrasi-primary text-white font-bold rounded-xl hover:bg-blue-900 transition-all shadow-lg shadow-imigrasi-primary/20"
          >
            Ajukan Pinjaman Sekarang
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Loan History */}
        <div className="lg:col-span-2 glass-card rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-neutral-700 flex items-center justify-between">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">Riwayat Pinjaman</h3>
            <button className="text-xs font-bold text-imigrasi-primary dark:text-imigrasi-accent hover:underline">Download Semua</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 dark:bg-neutral-800/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-bold">ID Pinjaman</th>
                  <th className="px-6 py-4 font-bold">Jumlah</th>
                  <th className="px-6 py-4 font-bold">Tenor</th>
                  <th className="px-6 py-4 font-bold">Tanggal</th>
                  <th className="px-6 py-4 font-bold text-center">Dokumen</th>
                  <th className="px-6 py-4 font-bold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-neutral-700">
                {DUMMY_LOANS.map((loan) => (
                  <tr key={loan.id} className="hover:bg-gray-50 dark:hover:bg-neutral-700/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-mono text-gray-600 dark:text-gray-300">{loan.id}</td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(loan.amount)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{loan.tenor} Bln</td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{loan.dateApplied}</td>
                    <td className="px-6 py-4 text-center">
                      {loan.status === 'Pending' ? (
                        <button 
                          onClick={() => {
                            setShowLoanModal(true);
                            setLoanStep(2);
                            setHasDownloaded(true);
                          }}
                          className="px-3 py-1.5 bg-amber-500/10 text-amber-600 rounded-lg text-[10px] font-bold hover:bg-amber-500 hover:text-white transition-all flex items-center justify-center gap-1 mx-auto"
                        >
                          <ArrowUpRight size={12} />
                          Upload
                        </button>
                      ) : (
                        <button className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors mx-auto">
                          <Eye size={14} />
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        loan.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {loan.status === 'Active' ? 'Berjalan' : 'Lunas'}
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
          <div className="glass-card p-6 rounded-3xl bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/30">
            <h4 className="font-bold text-amber-900 dark:text-amber-400 mb-4">Ketentuan Pinjaman</h4>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <div className="shrink-0 w-5 h-5 bg-amber-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold">1</div>
                <p className="text-xs text-amber-800 dark:text-amber-500/80 leading-relaxed">Maksimal pinjaman adalah 5x dari total simpanan wajib & pokok.</p>
              </li>
              <li className="flex gap-3">
                <div className="shrink-0 w-5 h-5 bg-amber-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold">2</div>
                <p className="text-xs text-amber-800 dark:text-amber-500/80 leading-relaxed">Suku bunga pinjaman adalah 1% flat per bulan dari total pinjaman.</p>
              </li>
              <li className="flex gap-3">
                <div className="shrink-0 w-5 h-5 bg-amber-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold">3</div>
                <p className="text-xs text-amber-800 dark:text-amber-500/80 leading-relaxed">Angsuran akan dipotong otomatis melalui bendahara gaji setiap bulan.</p>
              </li>
            </ul>
          </div>

          <div className="glass-card p-6 rounded-3xl flex items-center gap-4">
            <div className="p-3 bg-imigrasi-primary text-white rounded-2xl">
              <AlertCircle size={24} />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white">Butuh Bantuan?</h4>
              <p className="text-[10px] text-gray-500">Hubungi bendahara koperasi untuk konsultasi pinjaman.</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Loans;
