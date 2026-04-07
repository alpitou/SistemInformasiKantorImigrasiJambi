import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNotifications } from '../../hooks/useNotifications';
import { 
  FileText, 
  Upload, 
  Search, 
  Filter, 
  MoreVertical, 
  Download, 
  Trash2, 
  Eye, 
  X,
  Plus,
  File,
  CheckCircle2,
  Clock,
  Calendar
} from 'lucide-react';

const AdminDocuments: React.FC = () => {
  const { addNotification } = useNotifications();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocCategory, setNewDocCategory] = useState('Legal');

  const handleUpload = () => {
    if (!newDocTitle) return;
    
    // Simulate upload
    addNotification({
      title: 'Dokumen Baru Diunggah',
      message: `Dokumen "${newDocTitle}" telah tersedia di kategori ${newDocCategory}.`,
      type: 'info'
    });
    
    setShowUploadModal(false);
    setNewDocTitle('');
  };

  const documents = [
    { id: 'DOC001', title: 'AD/ART Koperasi 2024', category: 'Legal', date: '12 Jan 2024', size: '2.4 MB', status: 'Published' },
    { id: 'DOC002', title: 'Laporan RAT 2023', category: 'Laporan', date: '05 Feb 2024', size: '5.1 MB', status: 'Published' },
    { id: 'DOC003', title: 'Formulir Pinjaman Baru', category: 'Formulir', date: '20 Mar 2024', size: '450 KB', status: 'Draft' },
    { id: 'DOC004', title: 'Struktur Organisasi 2024', category: 'Internal', date: '01 Jan 2024', size: '1.2 MB', status: 'Published' },
    { id: 'DOC005', title: 'Kebijakan SHU 2025', category: 'Kebijakan', date: '15 Mar 2024', size: '890 KB', status: 'Published' },
  ];

  const filteredDocs = documents.filter(d => {
    const matchesSearch = d.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         d.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Semua' || d.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* Upload Modal */}
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
                <button onClick={() => setShowUploadModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="border-2 border-dashed border-gray-200 dark:border-neutral-700 rounded-3xl p-12 text-center space-y-4 hover:border-imigrasi-accent transition-colors cursor-pointer group">
                  <div className="w-16 h-16 bg-gray-50 dark:bg-neutral-700 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                    <Upload size={32} className="text-gray-400 group-hover:text-imigrasi-accent" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">Klik atau seret file ke sini</p>
                    <p className="text-xs text-gray-500 mt-1">PDF, DOCX, atau JPG (Maks. 10MB)</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Judul Dokumen</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: Laporan Keuangan Q1" 
                    value={newDocTitle}
                    onChange={(e) => setNewDocTitle(e.target.value)}
                    className="w-full p-4 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-2xl outline-none transition-all dark:text-white" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Kategori</label>
                  <select 
                    value={newDocCategory}
                    onChange={(e) => setNewDocCategory(e.target.value)}
                    className="w-full p-4 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-2xl outline-none transition-all dark:text-white"
                  >
                    <option>Legal</option>
                    <option>Laporan</option>
                    <option>Formulir</option>
                    <option>Kebijakan</option>
                    <option>Internal</option>
                  </select>
                </div>
                <button 
                  onClick={handleUpload}
                  className="w-full py-4 bg-imigrasi-primary text-white font-bold rounded-2xl hover:bg-blue-900 transition-all shadow-lg shadow-imigrasi-primary/20"
                >
                  Upload Dokumen
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manajemen Dokumen</h1>
          <p className="text-gray-500 dark:text-gray-400">Kelola dokumen resmi, formulir, dan laporan koperasi untuk anggota.</p>
        </div>
        <button 
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-6 py-2 bg-imigrasi-primary text-white rounded-xl text-sm font-bold hover:bg-blue-900 transition-colors shadow-lg shadow-imigrasi-primary/20"
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
            <option value="Legal">Legal</option>
            <option value="Laporan">Laporan</option>
            <option value="Formulir">Formulir</option>
            <option value="Kebijakan">Kebijakan</option>
            <option value="Internal">Internal</option>
          </select>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDocs.map((doc) => (
          <div key={doc.id} className="glass-card p-6 rounded-3xl group hover:border-imigrasi-accent transition-all">
            <div className="flex items-start justify-between mb-6">
              <div className="w-14 h-14 bg-imigrasi-primary/5 dark:bg-white/5 rounded-2xl flex items-center justify-center text-imigrasi-primary dark:text-imigrasi-accent group-hover:scale-110 transition-transform">
                <FileText size={28} />
              </div>
              <div className="flex items-center gap-1">
                <button className="p-2 text-gray-400 hover:text-imigrasi-primary transition-colors">
                  <Eye size={18} />
                </button>
                <button className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            <div className="space-y-1 mb-6">
              <h4 className="font-bold text-gray-900 dark:text-white line-clamp-1">{doc.title}</h4>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-imigrasi-accent uppercase tracking-widest">{doc.category}</span>
                <span className="text-[10px] text-gray-400">•</span>
                <span className="text-[10px] text-gray-400 font-mono">{doc.size}</span>
              </div>
            </div>
            <div className="pt-4 border-t border-gray-100 dark:border-neutral-700 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] text-gray-500">
                <Calendar size={12} />
                <span>{doc.date}</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider ${
                doc.status === 'Published' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {doc.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-3xl flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
            <File size={24} />
          </div>
          <div>
            <h4 className="text-2xl font-bold text-gray-900 dark:text-white">42</h4>
            <p className="text-xs text-gray-500">Total Dokumen</p>
          </div>
        </div>
        <div className="glass-card p-6 rounded-3xl flex items-center gap-4">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <h4 className="text-2xl font-bold text-gray-900 dark:text-white">38</h4>
            <p className="text-xs text-gray-500">Dokumen Publik</p>
          </div>
        </div>
        <div className="glass-card p-6 rounded-3xl flex items-center gap-4">
          <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl">
            <Clock size={24} />
          </div>
          <div>
            <h4 className="text-2xl font-bold text-gray-900 dark:text-white">4</h4>
            <p className="text-xs text-gray-500">Menunggu Review</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminDocuments;
