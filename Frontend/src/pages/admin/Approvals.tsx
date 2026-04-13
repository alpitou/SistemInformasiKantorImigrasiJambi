import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, CheckCircle2, XCircle, Clock, Search, Filter, RefreshCw, User, HandCoins, Wallet, ArrowDownRight, Info, Phone, Send, CreditCard } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { useAuth } from '../../hooks/useAuth';
import { adminService } from '../../services/api';
import { cn } from '../../lib/utils';

interface ApprovalRequest {
  id: string;
  name: string;
  phone: string;
  type: string;
  amount: number;
  date: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Transferring' | 'Completed';
  currentStep: 'Treasurer' | 'Chairman' | 'Transfer';
  avatar: string;
}

const ApprovalsPage: React.FC = () => {
  const { addNotification } = useNotifications();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const [requests, setRequests] = useState<ApprovalRequest[]>([
    { id: 'PJ-2026-001', name: 'Agus Setiawan', phone: '081234567890', type: 'Pinjaman', amount: 15000000, date: '2026-04-01', status: 'Pending', currentStep: 'Treasurer', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Agus' },
    { id: 'PJ-2026-002', name: 'Linda Permata', phone: '082345678901', type: 'Pinjaman', amount: 5000000, date: '2026-04-02', status: 'Pending', currentStep: 'Treasurer', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Linda' },
    { id: 'TR-2026-001', name: 'Rudi Hartono', phone: '083456789012', type: 'Penarikan Sukarela', amount: 2000000, date: '2026-04-03', status: 'Pending', currentStep: 'Treasurer', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rudi' },
    { id: 'PJ-2026-003', name: 'Budi Santoso', phone: '084567890123', type: 'Pinjaman', amount: 10000000, date: '2026-04-04', status: 'Completed', currentStep: 'Transfer', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Budi' },
  ]);

  const handleTreasurerApprove = (id: string) => {
    const request = requests.find(r => r.id === id);
    if (!request) return;

    setRequests(prev => prev.map(r => r.id === id ? { ...r, currentStep: 'Chairman' } : r));
    
    addNotification({
      title: 'Diteruskan ke Ketua',
      message: `Pengajuan ${request.id} telah disetujui Bendahara dan diteruskan ke Ketua.`,
      type: 'info'
    });
  };

  const handleChairmanApprove = (id: string) => {
    const request = requests.find(r => r.id === id);
    if (!request) return;

    setRequests(prev => prev.map(r => r.id === id ? { ...r, currentStep: 'Transfer', status: 'Approved' } : r));
    
    addNotification({
      title: 'Disetujui Ketua',
      message: `Pengajuan ${request.id} telah disetujui Ketua. Menunggu transfer dana oleh Bendahara.`,
      type: 'success'
    });
  };

  const handleTransferFunds = (id: string) => {
    const request = requests.find(r => r.id === id);
    if (!request) return;

    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'Completed' } : r));
    
    addNotification({
      title: 'Dana Ditransfer',
      message: `Dana untuk pengajuan ${request.id} telah ditransfer ke anggota.`,
      type: 'success'
    });

    // Notify member via WhatsApp (Simulated)
    console.log(`WhatsApp to ${request.phone}: Dana pinjaman Anda sebesar ${formatCurrency(request.amount)} telah ditransfer.`);
  };

  const handleReject = (id: string) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'Rejected' } : r));
    
    addNotification({
      title: 'Pengajuan Ditolak',
      message: `Pengajuan ID ${id} telah ditolak.`,
      type: 'error'
    });
  };

  const filteredRequests = requests.filter(r => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return r.status === 'Pending' || r.status === 'Approved';
    return r.status.toLowerCase() === activeTab.toLowerCase();
  });

  const canApprove = (req: ApprovalRequest) => {
    if (user?.role === 'treasurer' && req.currentStep === 'Treasurer' && req.status === 'Pending') return true;
    if (user?.role === 'chairman' && req.currentStep === 'Chairman' && req.status === 'Pending') return true;
    if (user?.role === 'treasurer' && req.currentStep === 'Transfer' && req.status === 'Approved') return true;
    if (user?.role === 'admin') return true; // Super admin can do everything
    return false;
  };

  const getStepLabel = (req: ApprovalRequest) => {
    if (req.status === 'Rejected') return 'Ditolak';
    if (req.status === 'Completed') return 'Selesai';
    if (req.currentStep === 'Treasurer' && req.status === 'Pending') return 'Menunggu Bendahara';
    if (req.currentStep === 'Chairman') return 'Menunggu Ketua';
    if (req.currentStep === 'Transfer' && req.status === 'Approved') return 'Siap Transfer';
    return req.status;
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Persetujuan Layanan</h1>
          <p className="text-gray-500 dark:text-gray-400">Verifikasi dan setujui pengajuan pinjaman atau penarikan anggota.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-3 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-500 hover:text-imigrasi-primary transition-colors">
            <RefreshCw size={18} />
          </button>
          <div className="flex items-center bg-gray-100 dark:bg-neutral-800 p-1 rounded-xl">
            <button 
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'pending' ? 'bg-white dark:bg-neutral-700 shadow-sm text-imigrasi-primary dark:text-white' : 'text-gray-500'}`}
            >
              Tertunda
            </button>
            <button 
              onClick={() => setActiveTab('all')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'all' ? 'bg-white dark:bg-neutral-700 shadow-sm text-imigrasi-primary dark:text-white' : 'text-gray-500'}`}
            >
              Semua
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Requests List */}
        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence mode="popLayout">
            {filteredRequests.map((req) => (
              <motion.div 
                key={req.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-card p-6 rounded-3xl border-l-4 border-l-imigrasi-accent"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <img src={req.avatar} alt="" className="w-14 h-14 rounded-2xl border-2 border-gray-100 dark:border-neutral-700" />
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white">{req.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-imigrasi-primary dark:text-imigrasi-accent uppercase tracking-wider">{req.type}</span>
                        <span className="text-[10px] text-gray-400">•</span>
                        <span className="text-[10px] text-gray-500 font-mono">{req.id}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-xs text-gray-500 mb-1">Jumlah Pengajuan</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(req.amount)}</p>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-neutral-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1.5">
                          <Clock size={14} />
                          <span>Diajukan: {req.date}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Phone size={14} />
                          <span>{req.phone}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status:</span>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider",
                          req.status === 'Completed' ? "bg-green-100 text-green-700" : 
                          req.status === 'Rejected' ? "bg-red-100 text-red-700" : 
                          "bg-amber-100 text-amber-700"
                        )}>
                          {getStepLabel(req)}
                        </span>
                      </div>
                    </div>
                    
                    {(req.status === 'Pending' || req.status === 'Approved') && req.status !== 'Completed' ? (
                      <div className="flex items-center gap-2">
                        {canApprove(req) ? (
                          <>
                            <button 
                              onClick={() => handleReject(req.id)}
                              className="flex-1 sm:flex-none px-6 py-2 bg-red-500/10 text-red-600 rounded-xl text-xs font-bold hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"
                            >
                              <XCircle size={14} /> Tolak
                            </button>
                            {req.currentStep === 'Treasurer' && req.status === 'Pending' && (
                              <button 
                                onClick={() => handleTreasurerApprove(req.id)}
                                className="flex-1 sm:flex-none px-6 py-2 bg-imigrasi-primary text-white rounded-xl text-xs font-bold hover:bg-blue-900 transition-all shadow-lg shadow-imigrasi-primary/20 flex items-center justify-center gap-2"
                              >
                                <Send size={14} /> Teruskan ke Ketua
                              </button>
                            )}
                            {req.currentStep === 'Chairman' && req.status === 'Pending' && (
                              <button 
                                onClick={() => handleChairmanApprove(req.id)}
                                className="flex-1 sm:flex-none px-6 py-2 bg-green-500 text-white rounded-xl text-xs font-bold hover:bg-green-600 transition-all shadow-lg shadow-green-500/20 flex items-center justify-center gap-2"
                              >
                                <CheckCircle2 size={14} /> Setujui (Ketua)
                              </button>
                            )}
                            {req.currentStep === 'Transfer' && req.status === 'Approved' && (
                              <button 
                                onClick={() => handleTransferFunds(req.id)}
                                className="flex-1 sm:flex-none px-6 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                              >
                                <CreditCard size={14} /> Transfer Dana
                              </button>
                            )}
                          </>
                        ) : (
                          <div className="text-[10px] font-bold text-gray-400 italic bg-gray-50 dark:bg-neutral-800 px-4 py-2 rounded-xl">
                            {user?.role === 'secretary' ? 'Hanya Lihat' : 'Menunggu Tahap Selanjutnya'}
                          </div>
                        )}
                      </div>
                  ) : (
                    <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      req.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {req.status === 'Completed' ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                      {req.status}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredRequests.length === 0 && (
            <div className="glass-card p-12 rounded-3xl text-center">
              <div className="w-20 h-20 bg-gray-100 dark:bg-neutral-700 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <ShieldCheck size={40} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Tidak Ada Antrean</h3>
              <p className="text-sm text-gray-500">Semua pengajuan telah diproses.</p>
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="space-y-8">
          <div className="glass-card p-6 rounded-3xl space-y-6">
            <h4 className="font-bold text-gray-900 dark:text-white">Statistik Persetujuan</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 text-amber-600 rounded-lg"><Clock size={16} /></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Menunggu</span>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white">12</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 text-green-600 rounded-lg"><CheckCircle2 size={16} /></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Disetujui</span>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white">145</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 text-red-600 rounded-lg"><XCircle size={16} /></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Ditolak</span>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white">8</span>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 rounded-3xl bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/30">
            <div className="flex items-center gap-3 mb-4">
              <Info size={20} className="text-amber-600" />
              <h4 className="font-bold text-amber-900 dark:text-amber-400">Panduan Verifikasi</h4>
            </div>
            <ul className="space-y-3 text-xs text-amber-800 dark:text-amber-500/80 leading-relaxed">
              <li className="flex gap-2">
                <span className="shrink-0">•</span>
                <span>Pastikan sisa gaji anggota mencukupi untuk angsuran pinjaman.</span>
              </li>
              <li className="flex gap-2">
                <span className="shrink-0">•</span>
                <span>Verifikasi total simpanan anggota sebagai jaminan pinjaman.</span>
              </li>
              <li className="flex gap-2">
                <span className="shrink-0">•</span>
                <span>Penarikan sukarela dapat disetujui jika saldo mencukupi.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ApprovalsPage;
