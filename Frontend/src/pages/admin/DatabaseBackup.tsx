import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Database, Download, Trash2, RefreshCw, FileArchive, 
  FileCode, FileJson, Calendar, HardDrive, AlertCircle,
  CheckCircle2, X, Clock, Search, Filter, Settings,
  ChevronLeft, ChevronRight, Plus, Shield, Server
} from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import api from '../../services/api';

interface BackupFile {
  filename: string;
  size: number;
  size_formatted: string;
  created_at: string;
  type: string;
}

const DatabaseBackup: React.FC = () => {
  const { addNotification } = useNotifications();
  const [isLoading, setIsLoading] = useState(false);
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [filteredBackups, setFilteredBackups] = useState<BackupFile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [showCleanModal, setShowCleanModal] = useState(false);
  const [cleanDays, setCleanDays] = useState(30);
  const [backupType, setBackupType] = useState('full');
  const [stats, setStats] = useState({
    total_backups: 0,
    total_size: 0,
    total_size_formatted: '0 B',
    latest_backup: null as string | null
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} menit yang lalu`;
    if (diffHours < 24) return `${diffHours} jam yang lalu`;
    return `${diffDays} hari yang lalu`;
  };

  const fetchBackups = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/database/backups/list');
      if (response.data.success) {
        setBackups(response.data.data);
        
        // Calculate stats
        const totalSize = response.data.data.reduce((sum: number, backup: BackupFile) => sum + backup.size, 0);
        const totalSizeFormatted = formatBytes(totalSize);
        const latestBackup = response.data.data.length > 0 ? response.data.data[0].created_at : null;
        
        setStats({
          total_backups: response.data.data.length,
          total_size: totalSize,
          total_size_formatted: totalSizeFormatted,
          latest_backup: latestBackup
        });
      }
    } catch (error: any) {
      console.error('Failed to fetch backups:', error);
      addNotification({
        title: 'Gagal',
        message: error.response?.data?.message || 'Gagal mengambil daftar backup',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    fetchBackups();
  }, [fetchBackups]);

  useEffect(() => {
    let filtered = [...backups];
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(backup => 
        backup.filename.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(backup => backup.type === selectedType);
    }
    
    setFilteredBackups(filtered);
  }, [searchTerm, selectedType, backups]);

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const handleBackup = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/database/backup', {
        params: { type: backupType },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      let filename = `database_backup_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}`;
      if (backupType === 'full') filename += '.zip';
      else if (backupType === 'sql') filename += '.sql';
      else filename += '_structure.sql';
      
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match) filename = match[1];
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      addNotification({
        title: 'Backup Berhasil',
        message: `Backup ${backupType === 'full' ? 'lengkap' : backupType === 'sql' ? 'SQL' : 'struktur'} database berhasil diunduh.`,
        type: 'success'
      });
      
      // Refresh backup list after a moment
      setTimeout(() => fetchBackups(), 2000);
      
    } catch (error: any) {
      console.error('Backup error:', error);
      addNotification({
        title: 'Backup Gagal',
        message: error.response?.data?.message || 'Gagal melakukan backup database',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadBackup = async (filename: string) => {
    setIsLoading(true);
    try {
      const response = await api.get(`/database/backup/download/${encodeURIComponent(filename)}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      addNotification({
        title: 'Berhasil',
        message: `File ${filename} berhasil diunduh.`,
        type: 'success'
      });
      
    } catch (error: any) {
      console.error('Download error:', error);
      addNotification({
        title: 'Gagal',
        message: error.response?.data?.message || 'Gagal mengunduh file backup',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBackup = async (filename: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus backup "${filename}"?`)) return;
    
    setIsLoading(true);
    try {
      const response = await api.delete(`/database/backup/delete/${encodeURIComponent(filename)}`);
      if (response.data.success) {
        addNotification({
          title: 'Berhasil',
          message: `File backup "${filename}" berhasil dihapus.`,
          type: 'success'
        });
        fetchBackups();
      }
    } catch (error: any) {
      console.error('Delete error:', error);
      addNotification({
        title: 'Gagal',
        message: error.response?.data?.message || 'Gagal menghapus file backup',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCleanBackups = async () => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus semua backup yang lebih dari ${cleanDays} hari?`)) return;
    
    setIsLoading(true);
    try {
      const response = await api.delete('/database/backup/clean', {
        params: { days: cleanDays }
      });
      if (response.data.success) {
        addNotification({
          title: 'Berhasil',
          message: response.data.message,
          type: 'success'
        });
        setShowCleanModal(false);
        fetchBackups();
      }
    } catch (error: any) {
      console.error('Clean error:', error);
      addNotification({
        title: 'Gagal',
        message: error.response?.data?.message || 'Gagal membersihkan backup lama',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getBackupIcon = (type: string) => {
    if (type === 'zip') return <FileArchive size={16} className="text-orange-500" />;
    if (type === 'sql') return <FileCode size={16} className="text-blue-500" />;
    return <FileJson size={16} className="text-purple-500" />;
  };

  const getBackupTypeLabel = (filename: string) => {
    if (filename.endsWith('.zip')) return { label: 'Full Backup', color: 'bg-purple-100 text-purple-700' };
    if (filename.includes('structure')) return { label: 'Struktur', color: 'bg-blue-100 text-blue-700' };
    if (filename.endsWith('.sql')) return { label: 'SQL Dump', color: 'bg-green-100 text-green-700' };
    return { label: 'Unknown', color: 'bg-gray-100 text-gray-700' };
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 p-4 md:p-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Database size={24} className="text-purple-600" />
            Manajemen Backup Database
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Kelola backup database, buat cadangan, dan pulihkan data koperasi
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchBackups}
            disabled={isLoading}
            className="p-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-500 hover:text-purple-600 transition-colors"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>


      {/* Create Backup Section */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-neutral-700">
          <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Plus size={18} className="text-purple-600" />
            Buat Backup Baru
          </h2>
          <p className="text-xs text-gray-500 mt-1">Pilih jenis backup yang ingin Anda buat</p>
        </div>
        
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <button
              onClick={() => setBackupType('full')}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                backupType === 'full'
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-gray-200 dark:border-neutral-700 hover:border-purple-300'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <FileArchive size={20} className="text-purple-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">Full Backup</p>
                  <p className="text-xs text-gray-500">Lengkap + Metadata</p>
                </div>
              </div>
              <p className="text-xs text-gray-500">Backup lengkap database termasuk struktur, data, dan metadata dalam format ZIP</p>
            </button>
            
            <button
              onClick={() => setBackupType('sql')}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                backupType === 'sql'
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-gray-200 dark:border-neutral-700 hover:border-purple-300'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <FileCode size={20} className="text-green-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">SQL Dump</p>
                  <p className="text-xs text-gray-500">File SQL</p>
                </div>
              </div>
              <p className="text-xs text-gray-500">Backup dalam format file SQL, cocok untuk restore via phpMyAdmin</p>
            </button>
            
            <button
              onClick={() => setBackupType('structure')}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                backupType === 'structure'
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-gray-200 dark:border-neutral-700 hover:border-purple-300'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Database size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">Struktur Saja</p>
                  <p className="text-xs text-gray-500">Tanpa Data</p>
                </div>
              </div>
              <p className="text-xs text-gray-500">Backup hanya struktur tabel database tanpa data, ukuran file kecil</p>
            </button>
          </div>
          
          <button
            onClick={handleBackup}
            disabled={isLoading}
            className="w-full py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <RefreshCw size={18} className="animate-spin" />
            ) : (
              <Download size={18} />
            )}
            {isLoading ? 'Memproses...' : 'Buat Backup Sekarang'}
          </button>
          
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg flex items-start gap-2">
            <AlertCircle size={16} className="text-yellow-600 shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-700 dark:text-yellow-400">
              Backup akan otomatis diunduh setelah selesai. Pastikan koneksi internet stabil.
              File backup disimpan di server dan dapat diunduh kapan saja.
            </p>
          </div>
        </div>
      </div>

      {/* Clean Modal */}
      <AnimatePresence>
        {showCleanModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowCleanModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-md bg-white dark:bg-neutral-800 rounded-xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-neutral-700 bg-amber-600 text-white">
                <h3 className="font-bold flex items-center gap-2">
                  <Trash2 size={18} />
                  Bersihkan Backup Lama
                </h3>
                <button 
                  onClick={() => setShowCleanModal(false)} 
                  className="p-1 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              
              <div className="p-5 space-y-4">
                <div className="text-center">
                  <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                    <AlertCircle size={28} className="text-amber-600" />
                  </div>
                  <h4 className="font-bold text-gray-900 dark:text-white">Hapus Backup Lama</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Tindakan ini akan menghapus semua file backup yang lebih lama dari periode yang dipilih
                  </p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Hapus backup lebih dari
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={cleanDays}
                      onChange={(e) => setCleanDays(Math.max(1, parseInt(e.target.value) || 30))}
                      className="w-24 px-3 py-2 text-center bg-gray-50 dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 rounded-lg focus:border-amber-500 outline-none"
                      min="1"
                      max="365"
                    />
                    <span className="text-gray-600 dark:text-gray-400">hari yang lalu</span>
                  </div>
                </div>
                
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    ⚠️ Backup yang akan dihapus tidak dapat dikembalikan. Pastikan Anda tidak membutuhkan data tersebut.
                  </p>
                </div>
                
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowCleanModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-100 dark:bg-neutral-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleCleanBackups}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isLoading ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                    {isLoading ? 'Memproses...' : 'Ya, Hapus'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default DatabaseBackup;