// src/pages/admin/WithdrawalApprovals.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  HandCoins, TrendingUp, Calendar, RefreshCw, CheckCircle2, Clock,
  AlertCircle, X, Eye, FileText, Wallet, Building2, CreditCard,
  User, Loader2, Search, Filter, DollarSign, MessageSquare,
  Check, Ban, Send, ChevronDown, ChevronUp, Info
} from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import api from '../../services/api';

interface WithdrawalRequest {
  id: number;
  user_id: number;
  amount: number;
  reason: string;
  saving_type: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  status: string;
  treasurer_approved_by: number | null;
  treasurer_approved_at: string | null;
  treasurer_notes: string | null;
  chairman_approved_by: number | null;
  chairman_approved_at: string | null;
  chairman_notes: string | null;
  disbursed_by: number | null;
  disbursed_at: string | null;
  disbursement_notes: string | null;
  created_at: string;
  user?: {
    id: number;
    name: string;
    nip: string;
    unit: string;
  };
  treasurerApprover?: { id: number; name: string; };
  chairmanApprover?: { id: number; name: string; };
  disburser?: { id: number; name: string; };
}

interface Stats {
  pending_treasurer: number;
  pending_chairman: number;
  approved: number;
  disbursed: number;
  rejected: number;
  total_amount_pending: number;
}

const WithdrawalApprovals: React.FC = () => {
  const { addNotification } = useNotifications();
  const [isLoading, setIsLoading] = useState(false);
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<WithdrawalRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState<Stats>({
    pending_treasurer: 0, pending_chairman: 0, approved: 0, disbursed: 0, rejected: 0, total_amount_pending: 0
  });
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [disbursementNotes, setDisbursementNotes] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDisburseModal, setShowDisburseModal] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/withdrawals');
      if (response.data.success) {
        setRequests(response.data.data);
        console.log('Withdrawal requests loaded:', response.data.data);
      }
    } catch (error) {
      addNotification({ title: 'Gagal', message: 'Gagal mengambil data pengajuan penarikan', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [addNotification]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get('/withdrawals/stats');
      if (response.data.success) setStats(response.data.data);
    } catch (error) { console.error('Failed to fetch stats:', error); }
  }, []);

  useEffect(() => { fetchRequests(); fetchStats(); }, [fetchRequests, fetchStats]);

  useEffect(() => {
    let filtered = [...requests];
    if (searchTerm) {
      filtered = filtered.filter(r =>
        r.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.user?.nip?.includes(searchTerm) ||
        r.account_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter !== 'all') filtered = filtered.filter(r => r.status === statusFilter);
    setFilteredRequests(filtered);
  }, [searchTerm, statusFilter, requests]);

  const handleApprove = async (id: number, role: 'treasurer' | 'chairman') => {
    if (!window.confirm(`Apakah Anda yakin ingin menyetujui penarikan ini?`)) return;
    setIsLoading(true);
    try {
      const endpoint = role === 'treasurer' ? `/withdrawals/${id}/treasurer-approve` : `/withdrawals/${id}/chairman-approve`;
      const response = await api.post(endpoint, { notes: approvalNotes });
      if (response.data.success) {
        addNotification({ title: 'Berhasil', message: response.data.message, type: 'success' });
        setApprovalNotes(''); setSelectedRequest(null); setShowDetailModal(false);
        fetchRequests(); fetchStats();
      }
    } catch (error: any) {
      addNotification({ title: 'Gagal', message: error.response?.data?.message || 'Gagal menyetujui penarikan', type: 'error' });
    } finally { setIsLoading(false); }
  };

  const handleReject = async (id: number) => {
    if (!rejectReason.trim()) {
      addNotification({ title: 'Validasi Gagal', message: 'Harap isi alasan penolakan', type: 'error' });
      return;
    }
    setIsLoading(true);
    try {
      const response = await api.post(`/withdrawals/${id}/reject`, { reason: rejectReason });
      if (response.data.success) {
        addNotification({ title: 'Berhasil', message: response.data.message, type: 'success' });
        setRejectReason(''); setShowRejectModal(false); setSelectedRequest(null); setShowDetailModal(false);
        fetchRequests(); fetchStats();
      }
    } catch (error: any) {
      addNotification({ title: 'Gagal', message: error.response?.data?.message || 'Gagal menolak penarikan', type: 'error' });
    } finally { setIsLoading(false); }
  };

  const handleDisburse = async () => {
    if (!selectedRequest) {
      addNotification({ title: 'Error', message: 'Tidak ada data penarikan yang dipilih', type: 'error' });
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post(`/withdrawals/${selectedRequest.id}/disburse`, {
        notes: disbursementNotes
      });

      console.log('Disburse response:', response.data);

      if (response.data.success) {
        addNotification({
          title: 'Berhasil',
          message: response.data.message || 'Dana berhasil dicairkan',
          type: 'success'
        });
        setDisbursementNotes('');
        setShowDisburseModal(false);
        setSelectedRequest(null);
        setShowDetailModal(false);
        await fetchRequests();
        await fetchStats();
      } else {
        addNotification({
          title: 'Gagal',
          message: response.data.message || 'Gagal melakukan pencairan',
          type: 'error'
        });
      }
    } catch (error: any) {
      console.error('Disburse error:', error);
      addNotification({
        title: 'Gagal',
        message: error.response?.data?.message || 'Terjadi kesalahan saat mencairkan dana',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpand = (id: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedRows(newExpanded);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string; icon: JSX.Element }> = {
      pending_treasurer: { label: 'Menunggu Bendahara', className: 'bg-amber-100 text-amber-700', icon: <Clock size={12} className="mr-1" /> },
      pending_chairman: { label: 'Menunggu Ketua', className: 'bg-blue-100 text-blue-700', icon: <Clock size={12} className="mr-1" /> },
      approved: { label: 'Siap Cairkan', className: 'bg-green-100 text-green-700', icon: <CheckCircle2 size={12} className="mr-1" /> },
      rejected: { label: 'Ditolak', className: 'bg-red-100 text-red-700', icon: <Ban size={12} className="mr-1" /> },
      disbursed: { label: 'Dicairkan', className: 'bg-emerald-100 text-emerald-700', icon: <Send size={12} className="mr-1" /> }
    };
    const s = statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-700', icon: <AlertCircle size={12} className="mr-1" /> };
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${s.className}`}>
        {s.icon}
        {s.label}
      </span>
    );
  };

  const getActionButtons = (request: WithdrawalRequest) => {
    const userStr = localStorage.getItem('user');
    let userRole = '';
    try { const parsed = userStr ? JSON.parse(userStr) : null; userRole = parsed?.role?.name || ''; } catch { userRole = ''; }

    if (userRole === 'bendahara') {
      if (request.status === 'pending_treasurer') {
        return (
          <div className="flex gap-2">
            <button onClick={() => { setSelectedRequest(request); setShowDetailModal(true); }} className="px-3 py-1.5 text-blue-600 bg-blue-50 rounded-lg text-xs font-medium hover:bg-blue-100">
              <Eye size={12} className="inline mr-1" />Detail
            </button>
            <button onClick={() => { setSelectedRequest(request); setApprovalNotes(''); setShowDetailModal(true); }} className="px-3 py-1.5 text-green-600 bg-green-50 rounded-lg text-xs font-medium hover:bg-green-100">
              <Check size={12} className="inline mr-1" />Setujui
            </button>
          </div>
        );
      }
      if (request.status === 'approved') {
        return (
          <div className="flex gap-2">
            <button onClick={() => { setSelectedRequest(request); setShowDetailModal(true); }} className="px-3 py-1.5 text-blue-600 bg-blue-50 rounded-lg text-xs font-medium hover:bg-blue-100">
              <Eye size={12} className="inline mr-1" />Detail
            </button>
            <button onClick={() => { setSelectedRequest(request); setDisbursementNotes(''); setShowDisburseModal(true); }} className="px-3 py-1.5 text-emerald-600 bg-emerald-50 rounded-lg text-xs font-medium hover:bg-emerald-100">
              <Send size={12} className="inline mr-1" />Cairkan
            </button>
          </div>
        );
      }
    }

    if (userRole === 'ketua' && request.status === 'pending_chairman') {
      return (
        <div className="flex gap-2">
          <button onClick={() => { setSelectedRequest(request); setShowDetailModal(true); }} className="px-3 py-1.5 text-blue-600 bg-blue-50 rounded-lg text-xs font-medium hover:bg-blue-100">
            <Eye size={12} className="inline mr-1" />Detail
          </button>
          <button onClick={() => { setSelectedRequest(request); setApprovalNotes(''); setShowDetailModal(true); }} className="px-3 py-1.5 text-green-600 bg-green-50 rounded-lg text-xs font-medium hover:bg-green-100">
            <Check size={12} className="inline mr-1" />Setujui
          </button>
        </div>
      );
    }

    return (
      <button onClick={() => { setSelectedRequest(request); setShowDetailModal(true); }} className="px-3 py-1.5 text-blue-600 bg-blue-50 rounded-lg text-xs font-medium hover:bg-blue-100">
        <Eye size={12} className="inline mr-1" />Detail
      </button>
    );
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <HandCoins size={24} className="text-imigrasi-primary" />
            Persetujuan Penarikan Simpanan
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Kelola pengajuan penarikan simpanan anggota dengan workflow berjenjang</p>
        </div>
        <button onClick={() => { fetchRequests(); fetchStats(); }} disabled={isLoading} className="p-3 bg-white dark:bg-neutral-800 border rounded-xl text-gray-500 hover:text-imigrasi-primary">
          <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-amber-100 rounded-xl p-3 text-center">
          <p className="text-[10px] text-amber-700">Menunggu Bendahara</p>
          <p className="text-2xl font-bold text-amber-700">{stats.pending_treasurer}</p>
        </div>
        <div className="bg-blue-100 rounded-xl p-3 text-center">
          <p className="text-[10px] text-blue-700">Menunggu Ketua</p>
          <p className="text-2xl font-bold text-blue-700">{stats.pending_chairman}</p>
        </div>
        <div className="bg-green-100 rounded-xl p-3 text-center">
          <p className="text-[10px] text-green-700">Siap Cairkan</p>
          <p className="text-2xl font-bold text-green-700">{stats.approved}</p>
        </div>
        <div className="bg-emerald-100 rounded-xl p-3 text-center">
          <p className="text-[10px] text-emerald-700">Dicairkan</p>
          <p className="text-2xl font-bold text-emerald-700">{stats.disbursed}</p>
        </div>
        <div className="bg-red-100 rounded-xl p-3 text-center">
          <p className="text-[10px] text-red-700">Ditolak</p>
          <p className="text-2xl font-bold text-red-700">{stats.rejected}</p>
        </div>
        <div className="bg-purple-100 rounded-xl p-3 text-center">
          <p className="text-[10px] text-purple-700">Total Pending</p>
          <p className="text-lg font-bold">{formatCurrency(stats.total_amount_pending)}</p>
        </div>
      </div>

      {/* Workflow Info */}
      <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <TrendingUp size={16} className="text-white" />
          </div>
          <div>
            <h4 className="font-bold text-blue-900 text-sm">Workflow Persetujuan Penarikan</h4>
            <div className="flex items-center gap-2 mt-1 text-xs text-blue-700">
              <span className="px-2 py-0.5 bg-amber-200 rounded-full">1. Pengajuan Anggota</span>
              <span>→</span>
              <span className="px-2 py-0.5 bg-blue-200 rounded-full">2. Verifikasi Bendahara</span>
              <span>→</span>
              <span className="px-2 py-0.5 bg-purple-200 rounded-full">3. Persetujuan Ketua</span>
              <span>→</span>
              <span className="px-2 py-0.5 bg-emerald-200 rounded-full">4. Pencairan Dana</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Cari nama anggota, NIP, atau rekening tujuan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:border-imigrasi-primary outline-none transition-colors dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:border-imigrasi-primary outline-none transition-colors dark:text-white"
          >
            <option value="all">Semua Status</option>
            <option value="pending_treasurer">Menunggu Bendahara</option>
            <option value="pending_chairman">Menunggu Ketua</option>
            <option value="approved">Siap Cairkan</option>
            <option value="disbursed">Dicairkan</option>
            <option value="rejected">Ditolak</option>
          </select>
        </div>
      </div>

      {/* Requests Table */}
      <div className="w-full">
        <div className="glass-card p-12 rounded-3xl">
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-900">Daftar Pengajuan Penarikan</h3>
            <p className="text-sm text-gray-500 mt-2">Menampilkan {filteredRequests.length} dari {requests.length} pengajuan</p>
          </div>
          {isLoading && requests.length === 0 ? (
            <div className="glass-card p-12 rounded-3xl text-center bg-white/50">
              <div className="flex justify-center">
                <Loader2 className="animate-spin text-blue-600" size={40} />
              </div>
              <p className="mt-6 text-gray-600 font-medium">Memuat data...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="glass-card p-12 rounded-3xl text-center bg-white/50">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
                  <HandCoins size={48} className="text-gray-300" />
                </div>
              </div>
              <p className="text-gray-600 font-medium">Belum ada pengajuan penarikan</p>
              <p className="text-sm text-gray-400 mt-2">Pengajuan penarikan akan muncul di sini</p>
            </div>
          ) : (
            <div className="glass-card rounded-3xl overflow-hidden bg-white/80 backdrop-blur-sm shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Tanggal</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Anggota</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Jenis Simpanan</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Jumlah</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Rekening Tujuan</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredRequests.map((request) => (
                      <React.Fragment key={request.id}>
                        <tr className="hover:bg-blue-50/50 transition-colors">
                          <td className="px-6 py-4 text-xs text-gray-500 font-medium">{formatDate(request.created_at)}</td>
                          <td className="px-6 py-4">
                            <p className="font-semibold text-gray-900">{request.user?.name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">NIP: {request.user?.nip || '-'}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-100 to-purple-50 text-purple-700 border border-purple-200">{request.saving_type}</span>
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-lg text-amber-600">{formatCurrency(request.amount)}</td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-medium text-gray-900">{request.bank_name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{request.account_number}</p>
                          </td>
                          <td className="px-6 py-4 text-center">{getStatusBadge(request.status)}</td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {getActionButtons(request)}
                              <button onClick={() => toggleExpand(request.id)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700">
                                {expandedRows.has(request.id) ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                              </button>
                            </div>
                          </td>
                        </tr>
                        {expandedRows.has(request.id) && (
                          <tr className="bg-gradient-to-r from-blue-50/30 to-indigo-50/30">
                            <td colSpan={7} className="px-6 py-6">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="glass-card p-4 rounded-xl bg-white/60">
                                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Alasan Penarikan</p>
                                  <p className="text-sm text-gray-900">{request.reason}</p>
                                </div>
                                {request.treasurer_approved_by && (
                                  <div className="glass-card p-4 rounded-xl bg-green-50/60">
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Disetujui Bendahara</p>
                                    <p className="text-sm font-semibold text-green-700">{request.treasurerApprover?.name}</p>
                                    <p className="text-xs text-green-600 mt-1">{formatDate(request.treasurer_approved_at)}</p>
                                  </div>
                                )}
                                {request.chairman_approved_by && (
                                  <div className="glass-card p-4 rounded-xl bg-green-50/60">
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Disetujui Ketua</p>
                                    <p className="text-sm font-semibold text-green-700">{request.chairmanApprover?.name}</p>
                                    <p className="text-xs text-green-600 mt-1">{formatDate(request.chairman_approved_at)}</p>
                                  </div>
                                )}
                                {request.disbursed_by && (
                                  <div className="glass-card p-4 rounded-xl bg-emerald-50/60">
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Dicairkan oleh</p>
                                    <p className="text-sm font-semibold text-emerald-700">{request.disburser?.name}</p>
                                    <p className="text-xs text-emerald-600 mt-1">{formatDate(request.disbursed_at)}</p>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDetailModal(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 z-10 p-5 border-b bg-gradient-to-r from-imigrasi-primary to-blue-800 text-white">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg">Detail Pengajuan Penarikan</h3>
                  <button onClick={() => setShowDetailModal(false)} className="p-1 hover:bg-white/10 rounded-full">
                    <X size={20} />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-6">
                {/* Informasi Anggota */}
                <div className="p-4 bg-gray-50 rounded-xl">
                  <h4 className="font-bold mb-3">Informasi Anggota</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><p className="text-gray-500">Nama</p><p className="font-medium">{selectedRequest.user?.name}</p></div>
                    <div><p className="text-gray-500">NIP</p><p>{selectedRequest.user?.nip || '-'}</p></div>
                    <div><p className="text-gray-500">Unit</p><p>{selectedRequest.user?.unit || '-'}</p></div>
                    <div><p className="text-gray-500">Tanggal Pengajuan</p><p>{formatDate(selectedRequest.created_at)}</p></div>
                  </div>
                </div>

                {/* Informasi Penarikan */}
                <div className="p-4 bg-amber-50 rounded-xl">
                  <h4 className="font-bold text-amber-900 mb-3">Informasi Penarikan</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between"><span>Jenis Simpanan</span><span className="font-bold text-purple-600">{selectedRequest.saving_type}</span></div>
                    <div className="flex justify-between"><span>Jumlah</span><span className="font-bold text-amber-600 text-lg">{formatCurrency(selectedRequest.amount)}</span></div>
                    <div><p>Alasan</p><p>{selectedRequest.reason}</p></div>
                  </div>
                </div>

                {/* Informasi Rekening Tujuan */}
                <div className="p-4 bg-blue-50 rounded-xl">
                  <h4 className="font-bold text-blue-900 mb-3">Rekening Tujuan</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><p className="text-gray-500">Bank</p><p>{selectedRequest.bank_name}</p></div>
                    <div><p className="text-gray-500">No Rekening</p><p>{selectedRequest.account_number}</p></div>
                    <div className="col-span-2"><p className="text-gray-500">Pemilik</p><p>{selectedRequest.account_name}</p></div>
                  </div>
                </div>

                {/* Approval Actions */}
                <div className="space-y-3">
                  {selectedRequest.status === 'pending_treasurer' && (
                    <>
                      <div><textarea value={approvalNotes} onChange={(e) => setApprovalNotes(e.target.value)} placeholder="Catatan (opsional)..." rows={2} className="w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm resize-none" /></div>
                      <div className="flex gap-3">
                        <button onClick={() => { setRejectReason(''); setShowRejectModal(true); }} className="flex-1 py-2 bg-red-500 text-white rounded-lg"><Ban size={16} className="inline mr-1" />Tolak</button>
                        <button onClick={() => handleApprove(selectedRequest.id, 'treasurer')} disabled={isLoading} className="flex-1 py-2 bg-green-600 text-white rounded-lg"><Check size={16} className="inline mr-1" />Setujui & Kirim ke Ketua</button>
                      </div>
                    </>
                  )}
                  {selectedRequest.status === 'pending_chairman' && (
                    <>
                      <div><textarea value={approvalNotes} onChange={(e) => setApprovalNotes(e.target.value)} placeholder="Catatan (opsional)..." rows={2} className="w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm resize-none" /></div>
                      <div className="flex gap-3">
                        <button onClick={() => { setRejectReason(''); setShowRejectModal(true); }} className="flex-1 py-2 bg-red-500 text-white rounded-lg"><Ban size={16} className="inline mr-1" />Tolak</button>
                        <button onClick={() => handleApprove(selectedRequest.id, 'chairman')} disabled={isLoading} className="flex-1 py-2 bg-green-600 text-white rounded-lg"><Check size={16} className="inline mr-1" />Setujui & Siap Cairkan</button>
                      </div>
                    </>
                  )}
                  {selectedRequest.status === 'approved' && (
                    <button onClick={() => setShowDisburseModal(true)} className="w-full py-2 bg-emerald-600 text-white rounded-lg"><Send size={16} className="inline mr-1" />Cairkan Dana Sekarang</button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reject Modal */}
      <AnimatePresence>
        {showRejectModal && selectedRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60" onClick={() => setShowRejectModal(false)} />
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-5 border-b bg-red-600 text-white"><h3 className="font-bold">Tolak Pengajuan Penarikan</h3></div>
              <div className="p-6 space-y-4">
                <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Masukkan alasan penolakan..." rows={3} className="w-full px-3 py-2 bg-gray-50 border rounded-lg resize-none" />
                <div className="flex gap-3">
                  <button onClick={() => setShowRejectModal(false)} className="flex-1 py-2 bg-gray-200 rounded-lg">Batal</button>
                  <button onClick={() => handleReject(selectedRequest.id)} disabled={isLoading} className="flex-1 py-2 bg-red-600 text-white rounded-lg"><Ban size={16} className="inline mr-1" />Tolak</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Disburse Modal */}
      <AnimatePresence>
        {showDisburseModal && selectedRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60" onClick={() => setShowDisburseModal(false)} />
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-5 border-b bg-emerald-600 text-white"><h3 className="font-bold">Konfirmasi Pencairan Dana</h3></div>
              <div className="p-6 space-y-4">
                <div className="p-3 bg-amber-50 rounded-lg">
                  <div className="flex justify-between mb-2"><span>Jenis Simpanan</span><span className="font-bold text-purple-600">{selectedRequest.saving_type}</span></div>
                  <div className="flex justify-between mb-2"><span>Jumlah</span><span className="font-bold text-amber-600">{formatCurrency(selectedRequest.amount)}</span></div>
                  <div className="flex justify-between"><span>Rekening Tujuan</span><span>{selectedRequest.bank_name} - {selectedRequest.account_number}</span></div>
                </div>
                <textarea value={disbursementNotes} onChange={(e) => setDisbursementNotes(e.target.value)} placeholder="Catatan pencairan (opsional)..." rows={2} className="w-full px-3 py-2 bg-gray-50 border rounded-lg resize-none" />
                <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-700"><Info size={14} className="inline mr-1" />Pencairan akan mengurangi saldo simpanan anggota secara otomatis.</div>
                <div className="flex gap-3">
                  <button onClick={() => setShowDisburseModal(false)} className="flex-1 py-2 bg-gray-200 rounded-lg">Batal</button>
                  <button onClick={handleDisburse} disabled={isLoading} className="flex-1 py-2 bg-emerald-600 text-white rounded-lg disabled:opacity-50">
                    {isLoading ? <Loader2 size={16} className="animate-spin inline mr-1" /> : <Send size={16} className="inline mr-1" />}
                    {isLoading ? 'Memproses...' : 'Ya, Cairkan Dana'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Info Box */}
      <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
        <div className="flex gap-2">
          <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-blue-900 text-sm">Informasi</h4>
            <p className="text-xs text-blue-800">
              Status <strong>"Siap Cairkan"</strong> menandakan penarikan sudah disetujui oleh Ketua dan siap untuk dicairkan oleh Bendahara.
              Setelah pencairan, saldo simpanan anggota akan berkurang secara otomatis.
            </p>
          </div>
        </div>
      </div>
    </motion.div >
  );
};

export default WithdrawalApprovals;