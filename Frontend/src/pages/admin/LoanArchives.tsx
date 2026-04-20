// src/pages/admin/LoanArchives.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  FileText, 
  Search, 
  Filter, 
  Download, 
  Calendar, 
  User, 
  CheckCircle2,
  RefreshCw,
  Archive,
  XCircle
} from 'lucide-react';
import api from '../../services/api';
import { useNotifications } from '../../hooks/useNotifications';

interface LoanArchive {
  id: number;
  user: {
    name: string;
    nip: string;
  };
  amount: number;
  status: string;
  created_at: string;
  agreement_document: string | null;
  agreement_original_name: string | null;
}

const LoanArchives: React.FC = () => {
  const { addNotification } = useNotifications();
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [archives, setArchives] = useState<LoanArchive[]>([]);

  const fetchArchives = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/loans', { params: { archive: true } });
      const allLoans = response.data?.data?.data || [];
      
      const filtered = allLoans.filter((loan: any) => 
        loan.status === 'completed' || 
        loan.status === 'rejected' || 
        loan.status === 'active' ||
        loan.status === 'approved'
      );
      setArchives(filtered);
    } catch (error) {
      console.error('Failed to fetch archives:', error);
      addNotification({
        title: 'Error',
        message: 'Gagal mengambil data arsip',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchArchives();
  }, []);

  const handleRefresh = () => {
    fetchArchives();
  };

  const handleDownloadDocument = async (loan: LoanArchive) => {
    if (!loan.agreement_document) {
      addNotification({
        title: 'Info',
        message: 'Dokumen tidak tersedia',
        type: 'info'
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.get(`/loans/${loan.id}/download-document`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', loan.agreement_original_name || `dokumen_${loan.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      addNotification({
        title: 'Berhasil',
        message: 'Dokumen berhasil diunduh',
        type: 'success'
      });
    } catch (error) {
      console.error('Failed to download document:', error);
      addNotification({
        title: 'Gagal',
        message: 'Gagal mengunduh dokumen',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      completed: { label: 'Lunas', className: 'bg-green-100 text-green-700' },
      rejected: { label: 'Ditolak', className: 'bg-red-100 text-red-700' },
      active: { label: 'Aktif', className: 'bg-blue-100 text-blue-700' },
      approved: { label: 'Disetujui', className: 'bg-emerald-100 text-emerald-700' }
    };
    const s = statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-700' };
    return <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${s.className}`}>{s.label}</span>;
  };

  const filteredArchives = archives.filter(item => 
    item.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.user?.nip?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.id.toString().includes(searchTerm)
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Arsip Perjanjian Pinjaman</h1>
          <p className="text-gray-500 dark:text-gray-400">Penyimpanan digital dokumen surat perjanjian pinjaman anggota.</p>
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card p-6 rounded-3xl border-l-4 border-blue-500">
          <div className="flex items-center gap-3 mb-2">
            <Archive className="text-blue-500" size={20} />
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Total Arsip</span>
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-white">{archives.length}</p>
        </div>
        <div className="glass-card p-6 rounded-3xl border-l-4 border-emerald-500">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="text-emerald-500" size={20} />
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Disetujui</span>
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-white">
            {archives.filter(a => a.status === 'approved').length}
          </p>
        </div>
        <div className="glass-card p-6 rounded-3xl border-l-4 border-green-500">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="text-green-500" size={20} />
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Aktif / Lunas</span>
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-white">
            {archives.filter(a => a.status === 'active' || a.status === 'completed').length}
          </p>
        </div>
        <div className="glass-card p-6 rounded-3xl border-l-4 border-red-500">
          <div className="flex items-center gap-3 mb-2">
            <XCircle className="text-red-500" size={20} />
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Ditolak</span>
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-white">
            {archives.filter(a => a.status === 'rejected').length}
          </p>
        </div>
      </div>

      <div className="glass-card p-4 rounded-3xl flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Cari nama anggota, NIP, atau ID pinjaman..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-2xl outline-none transition-all dark:text-white"
          />
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-gray-50 dark:bg-neutral-700 rounded-2xl text-sm font-bold text-gray-600 dark:text-gray-300">
          <Filter size={18} />
          Filter
        </button>
      </div>

      <div className="glass-card rounded-[2.5rem] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-neutral-800/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-bold">ID Pinjaman</th>
                <th className="px-6 py-4 font-bold">Anggota</th>
                <th className="px-6 py-4 font-bold">NIP</th>
                <th className="px-6 py-4 font-bold">Jumlah</th>
                <th className="px-6 py-4 font-bold">Tanggal</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-700">
              {filteredArchives.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    Tidak ada data arsip
                  </td>
                </tr>
              ) : (
                filteredArchives.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-neutral-700/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-mono text-gray-600 dark:text-gray-300">#{item.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-gray-400" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{item.user?.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-500">{item.user?.nip || '-'}</td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(item.amount)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(item.created_at).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4">{getStatusLabel(item.status)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {item.agreement_document && (
                          <button 
                            onClick={() => handleDownloadDocument(item)}
                            className="p-2 text-gray-400 hover:text-imigrasi-primary transition-colors"
                            title="Download Dokumen"
                          >
                            <Download size={18} />
                          </button>
                        )}
                      </div>
                    </td>
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

export default LoanArchives;