import React, { useState } from 'react';
import { motion } from 'motion/react';
import { FileText, Download, Eye, Search, Filter, Book, ShieldCheck, PieChart } from 'lucide-react';
import { cn } from '../../lib/utils';

const DocumentsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  const documents = [
    { id: 'DOC-001', title: 'AD/ART Koperasi Kanim Jambi', category: 'Legal', date: '2024-01-15', size: '2.4 MB' },
    { id: 'DOC-002', title: 'Laporan RAT Tahun Buku 2024', category: 'Laporan', date: '2025-03-10', size: '5.1 MB' },
    { id: 'DOC-003', title: 'Panduan Pinjaman & Simpanan', category: 'Edukasi', date: '2024-06-20', size: '1.2 MB' },
    { id: 'DOC-004', title: 'Struktur Kepengurusan 2024-2027', category: 'Legal', date: '2024-02-01', size: '0.8 MB' },
    { id: 'DOC-005', title: 'Laporan Keuangan Semester I 2025', category: 'Laporan', date: '2025-07-15', size: '3.5 MB' },
  ];

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         doc.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Semua' || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-sm text-gray-500 outline-none focus:border-imigrasi-accent transition-all"
          >
            <option value="Semua">Semua</option>
            <option value="Legal">Legal</option>
            <option value="Laporan">Laporan</option>
            <option value="Edukasi">Edukasi</option>
          </select>
        </div>
      </div>

      {/* Categories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div 
          onClick={() => setSelectedCategory('Legal')}
          className={cn(
            "glass-card p-6 rounded-3xl flex items-center gap-4 hover:border-imigrasi-accent transition-all cursor-pointer group",
            selectedCategory === 'Legal' && "border-imigrasi-accent bg-imigrasi-accent/5"
          )}
        >
          <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white">Legal</h4>
            <p className="text-xs text-gray-500">AD/ART & Aturan</p>
          </div>
        </div>
        <div 
          onClick={() => setSelectedCategory('Laporan')}
          className={cn(
            "glass-card p-6 rounded-3xl flex items-center gap-4 hover:border-imigrasi-accent transition-all cursor-pointer group",
            selectedCategory === 'Laporan' && "border-imigrasi-accent bg-imigrasi-accent/5"
          )}
        >
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform">
            <PieChart size={24} />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white">Laporan</h4>
            <p className="text-xs text-gray-500">RAT & Keuangan</p>
          </div>
        </div>
        <div 
          onClick={() => setSelectedCategory('Edukasi')}
          className={cn(
            "glass-card p-6 rounded-3xl flex items-center gap-4 hover:border-imigrasi-accent transition-all cursor-pointer group",
            selectedCategory === 'Edukasi' && "border-imigrasi-accent bg-imigrasi-accent/5"
          )}
        >
          <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl group-hover:scale-110 transition-transform">
            <Book size={24} />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white">Edukasi</h4>
            <p className="text-xs text-gray-500">Panduan & Tips</p>
          </div>
        </div>
        <div 
          onClick={() => setSelectedCategory('Semua')}
          className={cn(
            "glass-card p-6 rounded-3xl flex items-center gap-4 hover:border-imigrasi-accent transition-all cursor-pointer group",
            selectedCategory === 'Semua' && "border-imigrasi-accent bg-imigrasi-accent/5"
          )}
        >
          <div className="p-3 bg-purple-100 text-purple-600 rounded-2xl group-hover:scale-110 transition-transform">
            <FileText size={24} />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white">Semua</h4>
            <p className="text-xs text-gray-500">Lihat Semua Berkas</p>
          </div>
        </div>
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
        <div className="divide-y divide-gray-100 dark:divide-neutral-700">
          {filteredDocs.length > 0 ? (
            filteredDocs.map((doc) => (
              <div key={doc.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-neutral-700/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-imigrasi-primary/5 dark:bg-white/5 rounded-2xl flex items-center justify-center text-imigrasi-primary dark:text-white">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">{doc.title}</h4>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] font-bold text-imigrasi-accent uppercase tracking-wider">{doc.category}</span>
                      <span className="text-[10px] text-gray-400">•</span>
                      <span className="text-[10px] text-gray-500">{doc.date}</span>
                      <span className="text-[10px] text-gray-400">•</span>
                      <span className="text-[10px] text-gray-500">{doc.size}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-neutral-700 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 transition-colors">
                    <Eye size={14} />
                    Pratinjau
                  </button>
                  <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-imigrasi-primary text-white rounded-xl text-xs font-bold hover:bg-blue-900 transition-colors">
                    <Download size={14} />
                    Unduh
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center">
              <p className="text-gray-500">Tidak ada dokumen yang ditemukan.</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default DocumentsPage;
