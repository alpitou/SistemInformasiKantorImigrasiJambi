// src/pages/admin/Approvals.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, CheckCircle2, XCircle, Clock, RefreshCw, User, Phone, Send, CreditCard, FileText, Info } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';

interface LoanData {
  id: number;
  user_id: number;
  user: {
    id: number;
    name: string;
    email: string;
    nip: string;
    phone: string;
    unit: string;
  };
  amount: number;
  interest_rate: number;
  tenor_months: number;
  monthly_installment: number;
  remaining_balance: number;
  status: string;
  document_status: string;
  agreement_document: string | null;
  created_at: string;
}

const ApprovalsPage: React.FC = () => {
  const { addNotification } = useNotifications();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [loans, setLoans] = useState<LoanData[]>([]);

  const userRole = user?.role?.name || user?.role || 'anggota';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const fetchLoans = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/loans');
      if (response.data && response.data.data) {
        const loanData = response.data.data.data || [];
        setLoans(loanData);
      }
    } catch (error) {
      console.error('Failed to fetch loans:', error);
      addNotification({
        title: 'Error',
        message: 'Gagal mengambil data pengajuan',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  const handleRefresh = () => {
    fetchLoans();
  };

  const handleTreasurerApprove = async (id: number) => {
    setIsLoading(true);
    try {
      const response = await api.put(`/loans/${id}/treasurer-approve`, {});
      if (response.data.success) {
        addNotification({
          title: 'Berhasil',
          message: response.data.message,
          type: 'success'
        });
        fetchLoans();
      }
    } catch (error: any) {
      addNotification({
        title: 'Gagal',
        message: error.response?.data?.message || 'Gagal menyetujui pengajuan',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChairmanApprove = async (id: number) => {
    setIsLoading(true);
    try {
      const response = await api.put(`/loans/${id}/chairman-approve`, {});
      if (response.data.success) {
        addNotification({
          title: 'Berhasil',
          message: response.data.message,
          type: 'success'
        });
        fetchLoans();
      }
    } catch (error: any) {
      addNotification({
        title: 'Gagal',
        message: error.response?.data?.message || 'Gagal menyetujui pengajuan',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisburse = async (id: number) => {
    setIsLoading(true);
    try {
      const response = await api.put(`/loans/${id}/disburse`, {});
      if (response.data.success) {
        addNotification({
          title: 'Berhasil',
          message: response.data.message,
          type: 'success'
        });
        fetchLoans();
      }
    } catch (error: any) {
      addNotification({
        title: 'Gagal',
        message: error.response?.data?.message || 'Gagal mencairkan dana',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async (id: number) => {
    if (!window.confirm('Apakah Anda yakin ingin menolak pengajuan ini?')) return;
    
    setIsLoading(true);
    try {
      const response = await api.put(`/loans/${id}/reject`, {});
      if (response.data.success) {
        addNotification({
          title: 'Ditolak',
          message: response.data.message,
          type: 'error'
        });
        fetchLoans();
      }
    } catch (error: any) {
      addNotification({
        title: 'Gagal',
        message: error.response?.data?.message || 'Gagal menolak pengajuan',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string, documentStatus: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      pending_treasurer: { label: 'Menunggu Bendahara', className: 'bg-amber-100 text-amber-700' },
      pending_chairman: { label: 'Menunggu Ketua', className: 'bg-blue-100 text-blue-700' },
      approved: { label: 'Disetujui (Siap Cair)', className: 'bg-emerald-100 text-emerald-700' },
      rejected: { label: 'Ditolak', className: 'bg-red-100 text-red-700' },
      active: { label: 'Aktif (Sudah Cair)', className: 'bg-green-100 text-green-700' },
      completed: { label: 'Lunas', className: 'bg-gray-100 text-gray-700' }
    };
    const s = statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-700' };
    return (
      <div className="flex items-center gap-2">
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${s.className}`}>
          {s.label}
        </span>
        {documentStatus === 'uploaded' && (
          <span className="px-2 py-0.5 rounded-full text-[8px] font-bold bg-green-100 text-green-700">Dokumen ✓</span>
        )}
      </div>
    );
  };

  const getActionButton = (loan: LoanData) => {
    if (userRole === 'bendahara' && loan.status === 'pending_treasurer' && loan.document_status === 'uploaded') {
      return (
        <button 
          onClick={() => handleTreasurerApprove(loan.id)}
          disabled={isLoading}
          className="px-6 py-2 bg-imigrasi-primary text-white rounded-xl text-xs font-bold hover:bg-blue-900 transition-all flex items-center justify-center gap-2"
        >
          <Send size={14} /> Teruskan ke Ketua
        </button>
      );
    }
    
    if (userRole === 'ketua' && loan.status === 'pending_chairman') {
      return (
        <button 
          onClick={() => handleChairmanApprove(loan.id)}
          disabled={isLoading}
          className="px-6 py-2 bg-green-500 text-white rounded-xl text-xs font-bold hover:bg-green-600 transition-all flex items-center justify-center gap-2"
        >
          <CheckCircle2 size={14} /> Setujui (Ketua)
        </button>
      );
    }
    
    if (userRole === 'bendahara' && loan.status === 'approved') {
      return (
        <button 
          onClick={() => handleDisburse(loan.id)}
          disabled={isLoading}
          className="px-6 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
        >
          <CreditCard size={14} /> Cairkan Dana
        </button>
      );
    }
    
    return null;
  };

  const filteredLoans = loans.filter(loan => {
    if (userRole === 'bendahara') {
      return loan.status === 'pending_treasurer' || loan.status === 'approved';
    }
    if (userRole === 'ketua') {
      return loan.status === 'pending_chairman';
    }
    return true;
  });

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {userRole === 'bendahara' ? 'Persetujuan Bendahara' : userRole === 'ketua' ? 'Persetujuan Ketua' : 'Persetujuan Pinjaman'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Total pengajuan: {loans.length} | Menunggu: {filteredLoans.length}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleRefresh}
            className="p-3 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-500 hover:text-imigrasi-primary transition-colors"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {isLoading ? (
            <div className="glass-card p-12 rounded-3xl text-center">
              <div className="flex justify-center">
                <RefreshCw className="animate-spin text-imigrasi-primary" size={32} />
              </div>
              <p className="mt-4 text-gray-500">Memuat data...</p>
            </div>
          ) : filteredLoans.length === 0 ? (
            <div className="glass-card p-12 rounded-3xl text-center">
              <div className="w-20 h-20 bg-gray-100 dark:bg-neutral-700 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <ShieldCheck size={40} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Tidak Ada Pengajuan</h3>
              <p className="text-sm text-gray-500">
                {userRole === 'bendahara' 
                  ? 'Belum ada pengajuan pinjaman yang menunggu persetujuan Bendahara.'
                  : userRole === 'ketua'
                  ? 'Belum ada pengajuan pinjaman yang sudah diverifikasi Bendahara.'
                  : 'Belum ada pengajuan pinjaman.'}
              </p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredLoans.map((loan) => (
                <motion.div 
                  key={loan.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="glass-card p-6 rounded-3xl border-l-4 border-l-imigrasi-accent"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <img 
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${loan.user?.name || 'User'}`} 
                        alt="" 
                        className="w-14 h-14 rounded-2xl border-2 border-gray-100 dark:border-neutral-700" 
                      />
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white">{loan.user?.name || 'Unknown'}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold text-imigrasi-primary uppercase tracking-wider">Pinjaman</span>
                          <span className="text-[10px] text-gray-400">•</span>
                          <span className="text-[10px] text-gray-500 font-mono">#{loan.id}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-xs text-gray-500 mb-1">Jumlah Pengajuan</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(loan.amount)}</p>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-100 dark:border-neutral-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1.5">
                          <Clock size={14} />
                          <span>{new Date(loan.created_at).toLocaleDateString('id-ID')}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Phone size={14} />
                          <span>{loan.user?.phone || '-'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <FileText size={14} />
                          <span>{loan.tenor_months} bulan</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status:</span>
                        {getStatusBadge(loan.status, loan.document_status)}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {loan.agreement_document && (
                        <button 
                          onClick={() => window.open(api.defaults.baseURL + '/loans/' + loan.id + '/download-document', '_blank')}
                          className="p-2 text-gray-400 hover:text-imigrasi-primary transition-colors"
                          title="Download Dokumen"
                        >
                          <FileText size={18} />
                        </button>
                      )}
                      <button 
                        onClick={() => handleReject(loan.id)}
                        disabled={isLoading}
                        className="px-6 py-2 bg-red-500/10 text-red-600 rounded-xl text-xs font-bold hover:bg-red-500 hover:text-white transition-all"
                      >
                        <XCircle size={14} /> Tolak
                      </button>
                      {getActionButton(loan)}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        <div className="space-y-8">
          <div className="glass-card p-6 rounded-3xl space-y-6">
            <h4 className="font-bold text-gray-900 dark:text-white">Alur Persetujuan</h4>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</div>
                <div>
                  <p className="text-sm font-bold">Bendahara</p>
                  <p className="text-[10px] text-gray-500">Verifikasi dokumen & kelayakan</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold">2</div>
                <div>
                  <p className="text-sm font-bold">Ketua</p>
                  <p className="text-[10px] text-gray-500">Persetujuan akhir</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-xs font-bold">3</div>
                <div>
                  <p className="text-sm font-bold">Bendahara</p>
                  <p className="text-[10px] text-gray-500">Pencairan dana</p>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 rounded-3xl bg-amber-50 dark:bg-amber-900/20">
            <div className="flex items-center gap-3 mb-4">
              <Info size={20} className="text-amber-600" />
              <h4 className="font-bold text-amber-900 dark:text-amber-400">Panduan Verifikasi</h4>
            </div>
            <ul className="space-y-3 text-xs text-amber-800 dark:text-amber-500/80">
              <li className="flex gap-2">• Pastikan sisa gaji anggota mencukupi untuk angsuran</li>
              <li className="flex gap-2">• Verifikasi total simpanan anggota sebagai jaminan</li>
              <li className="flex gap-2">• Pastikan surat perjanjian sudah ditandatangani</li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ApprovalsPage;