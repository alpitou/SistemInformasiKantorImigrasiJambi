// frontend/src/pages/member/Documents.tsx

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  FileText, Download, Eye, Search, Book, ShieldCheck, 
  PieChart, Calendar, User, Lock, Globe 
} from 'lucide-react';
import { cn } from '../../lib/utils';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

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

const MemberDocuments: React.FC = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<number | null>(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchFiles();
    }
  }, [isAuthenticated, user, selectedCategory]);

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
      
      console.log('Fetching files with token...');
      const response = await api.get('/files', { params });
      console.log('Response:', response.data);
      
      if (response.data && response.data.success) {
        setFiles(response.data.data.data || []);
      } else {
        setFiles([]);
      }
    } catch (error: any) {
      console.error('Error fetching files:', error);
      if (error.response?.status === 401) {
        console.log('Unauthorized, redirecting to login...');
        // Biarkan useAuth handle redirect
      }
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (file: File) => {
    try {
      setDownloading(file.id);
      const response = await api.get(`/files/download/${file.id}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.original_name);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Error downloading file:', error);
      if (error.response?.status === 401) {
        alert('Sesi Anda habis, silakan login kembali');
      } else if (error.response?.status === 403) {
        alert('Anda tidak memiliki akses ke file ini');
      } else {
        alert('Gagal mengunduh file');
      }
    } finally {
      setDownloading(null);
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
      case 'public': return <Globe size={12} className="text-green-500" />;
      case 'member': return <User size={12} className="text-blue-500" />;
      case 'board': return <Lock size={12} className="text-red-500" />;
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

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-imigrasi-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Silakan login untuk mengakses dokumen</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dokumen Digital</h1>
          <p className="text-gray-500 dark:text-gray-400">Akses dokumen resmi, laporan RAT, dan panduan koperasi.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Cari dokumen..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-sm w-48 outline-none focus:border-imigrasi-accent transition-all" 
            />
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <CategoryCard 
          icon={<ShieldCheck size={24} />}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          title="Legal"
          subtitle="AD/ART & Aturan"
          isActive={selectedCategory === 'Legal'}
          onClick={() => setSelectedCategory('Legal')}
        />
        <CategoryCard 
          icon={<PieChart size={24} />}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
          title="Laporan"
          subtitle="RAT & Keuangan"
          isActive={selectedCategory === 'Laporan'}
          onClick={() => setSelectedCategory('Laporan')}
        />
        <CategoryCard 
          icon={<Book size={24} />}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
          title="Edukasi"
          subtitle="Panduan & Tips"
          isActive={selectedCategory === 'Edukasi'}
          onClick={() => setSelectedCategory('Edukasi')}
        />
        <CategoryCard 
          icon={<FileText size={24} />}
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
          title="Semua"
          subtitle="Lihat Semua Berkas"
          isActive={selectedCategory === 'Semua'}
          onClick={() => setSelectedCategory('Semua')}
        />
      </div>

      {/* Document List */}
      <div className="glass-card rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-neutral-700 flex items-center justify-between">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white">Daftar Berkas Terbaru</h3>
          {selectedCategory !== 'Semua' && (
            <button 
              onClick={() => setSelectedCategory('Semua')}
              className="text-xs font-bold text-imigrasi-primary dark:text-imigrasi-accent hover:underline"
            >
              Reset Filter
            </button>
          )}
        </div>
        
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-imigrasi-primary border-t-transparent"></div>
            <p className="mt-4 text-gray-500">Memuat dokumen...</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-neutral-700">
            {filteredFiles.length > 0 ? (
              filteredFiles.map((file) => (
                <div key={file.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-neutral-700/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-imigrasi-primary/5 dark:bg-white/5 rounded-2xl flex items-center justify-center text-imigrasi-primary dark:text-white">
                      <FileText size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white">{file.file_name}</h4>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                        <span className="text-[10px] font-bold text-imigrasi-accent uppercase tracking-wider">
                          {getCategoryLabel(file.file_category)}
                        </span>
                        <span className="text-[10px] text-gray-400">•</span>
                        <span className="text-[10px] text-gray-500 flex items-center gap-1">
                          <Calendar size={10} />
                          {new Date(file.created_at).toLocaleDateString('id-ID')}
                        </span>
                        <span className="text-[10px] text-gray-400">•</span>
                        <span className="text-[10px] text-gray-500">{file.file_size}</span>
                        <span className="text-[10px] text-gray-400">•</span>
                        <span className="text-[10px] text-gray-500 flex items-center gap-1">
                          {getAccessIcon(file.access_level)}
                          {getAccessLabel(file.access_level)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => window.open(file.url, '_blank')}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-neutral-700 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 transition-colors"
                    >
                      <Eye size={14} />
                      Pratinjau
                    </button>
                    <button 
                      onClick={() => handleDownload(file)}
                      disabled={downloading === file.id}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-imigrasi-primary text-white rounded-xl text-xs font-bold hover:bg-blue-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {downloading === file.id ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Download size={14} />
                      )}
                      Unduh
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center">
                <FileText className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-500">Tidak ada dokumen yang tersedia untuk anggota.</p>
                <p className="text-gray-400 text-sm mt-2">Dokumen dengan akses "Publik" atau "Anggota" akan muncul di sini.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

const CategoryCard = ({ icon, iconBg, iconColor, title, subtitle, isActive, onClick }: any) => (
  <div 
    onClick={onClick}
    className={cn(
      "glass-card p-6 rounded-3xl flex items-center gap-4 hover:border-imigrasi-accent transition-all cursor-pointer group",
      isActive && "border-imigrasi-accent bg-imigrasi-accent/5"
    )}
  >
    <div className={cn("p-3 rounded-2xl group-hover:scale-110 transition-transform", iconBg, iconColor)}>
      {icon}
    </div>
    <div>
      <h4 className="font-bold text-gray-900 dark:text-white">{title}</h4>
      <p className="text-xs text-gray-500">{subtitle}</p>
    </div>
  </div>
);

export default MemberDocuments;