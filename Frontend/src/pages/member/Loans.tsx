// src/pages/member/Loans.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HandCoins, TrendingUp, PieChart, ArrowUpRight, ArrowDownRight, Download, Info, Calendar, RefreshCw, CheckCircle2, Clock, AlertCircle, X, Eye, Upload, FileText } from 'lucide-react';
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
}

const Loans: React.FC = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [isLoading, setIsLoading] = useState(false);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [loanStep, setLoanStep] = useState(1);
  const [loanAmount, setLoanAmount] = useState('');
  const [loanTenor, setLoanTenor] = useState('12');
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [currentLoanId, setCurrentLoanId] = useState<number | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/loans');
      setLoans(response.data.data.data || []);
    } catch (error) {
      console.error('Failed to fetch loans:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    await fetchLoans();
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

    setIsLoading(true);
    try {
      const response = await api.post('/loans', {
        amount: parseInt(loanAmount),
        tenor_months: parseInt(loanTenor),
        interest_rate: 1.0
      });

      if (response.data.success) {
        const newLoan = response.data.data;
        setCurrentLoanId(newLoan.id);
        setLoanStep(2);
        addNotification({
          title: 'Pengajuan Dibuat',
          message: 'Silakan download dan upload surat perjanjian yang sudah ditandatangani',
          type: 'success'
        });
      }
    } catch (error: any) {
      console.error('Failed to submit loan:', error);
      addNotification({
        title: 'Gagal',
        message: error.response?.data?.message || 'Gagal mengajukan pinjaman',
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
        title: 'Gagal',
        message: 'Gagal mengunduh dokumen',
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
        title: 'Error',
        message: 'Hanya file PDF, JPG, atau PNG yang diperbolehkan',
        type: 'error'
      });
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      addNotification({
        title: 'Error',
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
          message: 'Dokumen berhasil diunggah. Menunggu persetujuan admin.',
          type: 'success'
        });
        
        // Submit final loan
        await api.put(`/loans/${currentLoanId}/approve`, {});
        addNotification({
          title: 'Pengajuan Terkirim',
          message: 'Pengajuan pinjaman Anda telah dikirim dan menunggu verifikasi.',
          type: 'success'
        });
        
        setShowLoanModal(false);
        resetLoanForm();
        fetchLoans();
      }
    } catch (error: any) {
      console.error('Failed to upload document:', error);
      addNotification({
        title: 'Gagal',
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
    setLoanTenor('12');
    setHasDownloaded(false);
    setUploadedFile(null);
    setCurrentLoanId(null);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      pending: { label: 'Menunggu', className: 'bg-amber-100 text-amber-700' },
      approved: { label: 'Disetujui', className: 'bg-blue-100 text-blue-700' },
      rejected: { label: 'Ditolak', className: 'bg-red-100 text-red-700' },
      active: { label: 'Aktif', className: 'bg-emerald-100 text-emerald-700' },
      completed: { label: 'Lunas', className: 'bg-green-100 text-green-700' }
    };
    const s = statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-700' };
    return <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${s.className}`}>{s.label}</span>;
  };

  const activeLoan = loans.find(l => l.status === 'active');

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
              className="relative w-full max-w-2xl bg-white dark:bg-neutral-800 rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 dark:border-neutral-700 flex items-center justify-between bg-imigrasi-primary text-white">
                <h3 className="font-bold text-xl">
                  {loanStep === 1 ? 'Pengajuan Pinjaman' : loanStep === 2 ? 'Upload Dokumen' : 'Pengajuan Selesai'}
                </h3>
                <button onClick={() => {
                  setShowLoanModal(false);
                  resetLoanForm();
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
                      onClick={handleSubmitLoan}
                      disabled={isLoading || !loanAmount}
                      className="w-full py-4 bg-imigrasi-primary text-white font-bold rounded-2xl hover:bg-blue-900 transition-all shadow-lg shadow-imigrasi-primary/20 disabled:opacity-50"
                    >
                      {isLoading ? <RefreshCw className="animate-spin mx-auto" size={20} /> : 'Lanjut ke Dokumen'}
                    </button>
                  </>
                ) : loanStep === 2 ? (
                  <div className="space-y-6">
                    <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-center">
                      <FileText size={48} className="mx-auto text-blue-600 mb-3" />
                      <h4 className="font-bold text-gray-900 dark:text-white mb-2">Surat Perjanjian Pinjaman</h4>
                      <p className="text-xs text-gray-500 mb-4">Download, cetak, tanda tangani, lalu upload kembali</p>
                      <button 
                        onClick={handleDownloadAgreement}
                        disabled={isLoading}
                        className="px-6 py-3 bg-imigrasi-accent text-imigrasi-primary font-bold rounded-xl hover:bg-white transition-all flex items-center justify-center gap-2 mx-auto"
                      >
                        <Download size={18} />
                        Download Surat Perjanjian
                      </button>
                    </div>

                    {hasDownloaded && (
                      <div className="space-y-4">
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-100">
                          <CheckCircle2 size={20} className="text-green-600 mb-2" />
                          <p className="text-xs text-green-700 dark:text-green-400">Dokumen telah diunduh. Silakan upload hasil scan yang sudah ditandatangani.</p>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Upload Dokumen (PDF/JPG/PNG)</label>
                          <div className="border-2 border-dashed border-gray-300 dark:border-neutral-600 rounded-2xl p-6 text-center">
                            <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                            <p className="text-xs text-gray-500 mb-2">Klik atau drag file ke sini</p>
                            <input 
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={handleFileUpload}
                              className="hidden"
                              id="document-upload"
                            />
                            <label 
                              htmlFor="document-upload"
                              className="px-4 py-2 bg-gray-100 dark:bg-neutral-700 rounded-xl text-xs font-bold cursor-pointer inline-block"
                            >
                              Pilih File
                            </label>
                            {uploadedFile && (
                              <p className="text-xs text-green-600 mt-2">File dipilih: {uploadedFile.name}</p>
                            )}
                          </div>
                        </div>

                        <button 
                          onClick={handleUploadDocument}
                          disabled={isLoading || !uploadedFile}
                          className="w-full py-4 bg-imigrasi-primary text-white font-bold rounded-2xl hover:bg-blue-900 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {isLoading ? <RefreshCw className="animate-spin" size={20} /> : <Upload size={20} />}
                          Kirim Pengajuan
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
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
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
                onClick={() => {
                  setSelectedLoan(activeLoan);
                  setShowScheduleModal(true);
                }}
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

      {/* Loan History Table */}
      <div className="glass-card rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-neutral-700">
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
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Belum ada riwayat pinjaman
                  </td>
                </tr>
              ) : (
                loans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-gray-50 dark:hover:bg-neutral-700/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-mono text-gray-600 dark:text-gray-300">#{loan.id}</td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(loan.amount)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{loan.tenor_months} Bln</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{formatCurrency(loan.monthly_installment)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(loan.created_at).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-center">{getStatusBadge(loan.status)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

export default Loans;