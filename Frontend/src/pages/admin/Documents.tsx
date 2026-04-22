// frontend/src/pages/admin/Documents.tsx

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, Upload, Search, Trash2, Eye, X, Plus, 
  Globe, User, Lock, Calendar, Users 
} from 'lucide-react';
import { cn } from '../../lib/utils';
import api from '../../services/api'; // Import dari api.ts
import { useNotifications } from '../../hooks/useNotifications';

interface File {
  id: number;
  file_name: string;
  file_category: string;
  access_level: string;
  original_name: string;
  mime_type: string;
  file_size: string;
  created_at: string;
  url: string;
  uploader: {
    id: number;
    name: string;
  };
}

const AdminDocuments: React.FC = () => {
  const { addNotification } = useNotifications();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocCategory, setNewDocCategory] = useState('regulation');
  const [newAccessLevel, setNewAccessLevel] = useState('member');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    fetchFiles();
  }, [selectedCategory]);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (selectedCategory !== 'Semua') {
        let categoryMap: Record<string, string> = {
          'Laporan': 'report',
          'Legal': 'regulation', 
          'Edukasi': 'news'
        };
        params.category = categoryMap[selectedCategory] || selectedCategory.toLowerCase();
      }
      
      console.log('Fetching files with params:', params);
      const response = await api.get('/files', { params });
      console.log('Response:', response.data);
      
      // Akses data dengan benar
      if (response.data && response.data.success) {
        setFiles(response.data.data.data || []);
      } else if (response.data && response.data.data) {
        setFiles(response.data.data.data || []);
      } else {
        setFiles([]);
      }
    } catch (error: any) {
      console.error('Error fetching files:', error);
      addNotification({
        title: 'Gagal Memuat Data',
        message: error.response?.data?.message || 'Terjadi kesalahan saat memuat dokumen',
        type: 'error'
      });
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!newDocTitle || !selectedFile) {
      addNotification({
        title: 'Validasi Gagal',
        message: 'Harap lengkapi semua field dan pilih file',
        type: 'error'
      });
      return;
    }

    const formData = new FormData();
    formData.append('file_name', newDocTitle);
    formData.append('file_category', newDocCategory);
    formData.append('access_level', newAccessLevel);
    formData.append('file', selectedFile);

    try {
      setUploading(true);
      console.log('Uploading file...');
      const response = await api.post('/files', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      console.log('Upload success:', response.data);
      
      addNotification({
        title: 'Dokumen Berhasil Diupload',
        message: `Dokumen "${newDocTitle}" telah tersedia.`,
        type: 'success'
      });
      
      setShowUploadModal(false);
      setNewDocTitle('');
      setSelectedFile(null);
      fetchFiles();
    } catch (error: any) {
      console.error('Error uploading file:', error);
      addNotification({
        title: 'Upload Gagal',
        message: error.response?.data?.message || 'Terjadi kesalahan saat upload',
        type: 'error'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (file: File) => {
    if (!confirm(`Hapus dokumen "${file.file_name}"?`)) return;

    try {
      await api.delete(`/files/${file.id}`);
      addNotification({
        title: 'Dokumen Dihapus',
        message: `Dokumen "${file.file_name}" berhasil dihapus`,
        type: 'info'
      });
      fetchFiles();
    } catch (error: any) {
      console.error('Error deleting file:', error);
      addNotification({
        title: 'Hapus Gagal',
        message: error.response?.data?.message || 'Terjadi kesalahan saat menghapus dokumen',
        type: 'error'
      });
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      report: 'Laporan',
      regulation: 'Legal',
      news: 'Edukasi'
    };
    return labels[category] || category;
  };

  const getAccessIcon = (level: string) => {
    switch(level) {
      case 'public': return <Globe size={14} className="text-green-500" />;
      case 'member': return <User size={14} className="text-blue-500" />;
      case 'board': return <Lock size={14} className="text-red-500" />;
      default: return null;
    }
  };

  const getAccessLabel = (level: string) => {
    switch(level) {
      case 'public': return 'Publik';
      case 'member': return 'Anggota';
      case 'board': return 'Pengurus';
      default: return level;
    }
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.file_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         file.file_category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* Upload Modal Sama seperti sebelumnya */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowUploadModal(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-neutral-800 rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 dark:border-neutral-700 flex items-center justify-between bg-imigrasi-primary text-white">
                <h3 className="font-bold text-xl">Upload Dokumen Baru</h3>
                <button 
                  onClick={() => setShowUploadModal(false)} 
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  disabled={uploading}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div 
                  className={cn(
                    "border-2 border-dashed rounded-3xl p-12 text-center space-y-4 transition-all cursor-pointer",
                    selectedFile ? "border-imigrasi-accent bg-imigrasi-accent/5" : "border-gray-200 dark:border-neutral-700 hover:border-imigrasi-accent"
                  )}
                  onClick={() => document.getElementById('fileInput')?.click()}
                >
                  <input
                    id="fileInput"
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    disabled={uploading}
                  />
                  <div className="w-16 h-16 bg-gray-50 dark:bg-neutral-700 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                    <Upload size={32} className={cn("transition-colors", selectedFile ? "text-imigrasi-accent" : "text-gray-400")} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">
                      {selectedFile ? selectedFile.name : 'Klik atau seret file ke sini'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">PDF, DOC, DOCX, XLS, XLSX (Maks. 5MB)</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Judul Dokumen</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: AD/ART Koperasi 2024" 
                    value={newDocTitle}
                    onChange={(e) => setNewDocTitle(e.target.value)}
                    disabled={uploading}
                    className="w-full p-4 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-2xl outline-none transition-all dark:text-white disabled:opacity-50" 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Kategori</label>
                    <select 
                      value={newDocCategory}
                      onChange={(e) => setNewDocCategory(e.target.value)}
                      disabled={uploading}
                      className="w-full p-4 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-2xl outline-none transition-all dark:text-white disabled:opacity-50"
                    >
                      <option value="regulation">Legal / AD-ART</option>
                      <option value="report">Laporan</option>
                      <option value="news">Edukasi / Panduan</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Hak Akses</label>
                    <select 
                      value={newAccessLevel}
                      onChange={(e) => setNewAccessLevel(e.target.value)}
                      disabled={uploading}
                      className="w-full p-4 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-2xl outline-none transition-all dark:text-white disabled:opacity-50"
                    >
                      <option value="public">Publik (Semua Orang)</option>
                      <option value="member">Anggota (Anggota + Publik)</option>
                      <option value="board">Pengurus (Khusus Pengurus)</option>
                    </select>
                  </div>
                </div>
                
                <button 
                  onClick={handleUpload}
                  disabled={uploading || !selectedFile || !newDocTitle}
                  className="w-full py-4 bg-imigrasi-primary text-white font-bold rounded-2xl hover:bg-blue-900 transition-all shadow-lg shadow-imigrasi-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Mengupload...
                    </>
                  ) : (
                    <>
                      <Upload size={18} />
                      Upload Dokumen
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manajemen Dokumen</h1>
          <p className="text-gray-500 dark:text-gray-400">Kelola dokumen resmi, formulir, dan laporan koperasi untuk anggota.</p>
        </div>
        <button 
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-imigrasi-primary text-white rounded-xl text-sm font-bold hover:bg-blue-900 transition-colors shadow-lg shadow-imigrasi-primary/20"
        >
          <Plus size={18} />
          Upload Baru
        </button>
      </div>

      {/* Filters & Search */}
      <div className="glass-card p-4 rounded-3xl flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Cari judul atau kategori dokumen..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-2xl outline-none transition-all dark:text-white"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="flex-1 md:flex-none px-4 py-3 bg-gray-50 dark:bg-neutral-700 rounded-2xl text-sm font-bold text-gray-600 dark:text-gray-300 outline-none border-2 border-transparent focus:border-imigrasi-accent transition-all"
          >
            <option value="Semua">Semua Kategori</option>
            <option value="Laporan">Laporan</option>
            <option value="Legal">Legal</option>
            <option value="Edukasi">Edukasi</option>
          </select>
        </div>
      </div>

      {/* Documents Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-imigrasi-primary border-t-transparent"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFiles.length > 0 ? (
            filteredFiles.map((file) => (
              <div key={file.id} className="glass-card p-6 rounded-3xl group hover:border-imigrasi-accent transition-all">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-14 h-14 bg-imigrasi-primary/5 dark:bg-white/5 rounded-2xl flex items-center justify-center text-imigrasi-primary dark:text-imigrasi-accent group-hover:scale-110 transition-transform">
                    <FileText size={28} />
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => window.open(file.url, '_blank')}
                      className="p-2 text-gray-400 hover:text-imigrasi-primary transition-colors"
                      title="Pratinjau"
                    >
                      <Eye size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(file)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      title="Hapus"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <div className="space-y-2 mb-6">
                  <h4 className="font-bold text-gray-900 dark:text-white line-clamp-2">{file.file_name}</h4>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold text-imigrasi-accent uppercase tracking-widest">
                      {getCategoryLabel(file.file_category)}
                    </span>
                    <span className="text-[10px] text-gray-400">•</span>
                    <span className="text-[10px] text-gray-400 font-mono">{file.file_size}</span>
                    <span className="text-[10px] text-gray-400">•</span>
                    <span className="text-[10px] flex items-center gap-1">
                      {getAccessIcon(file.access_level)}
                      <span className="text-gray-500">{getAccessLabel(file.access_level)}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-gray-500 pt-1">
                    <Users size={10} />
                    <span>{file.uploader?.name || 'Unknown'}</span>
                    <span className="text-gray-400">•</span>
                    <Calendar size={10} />
                    <span>{new Date(file.created_at).toLocaleDateString('id-ID')}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <FileText className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-500">Belum ada dokumen. Klik "Upload Baru" untuk menambahkan.</p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default AdminDocuments;