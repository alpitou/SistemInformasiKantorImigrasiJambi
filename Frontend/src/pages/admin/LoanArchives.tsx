import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  FileText, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Calendar, 
  User, 
  CheckCircle2,
  Clock,
  RefreshCw,
  Archive
} from 'lucide-react';

const LoanArchives: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const archives = [
    { id: 'ARC-001', member: 'Budi Santoso', loanId: 'PJ-2024-001', date: '2024-08-10', status: 'Verified', type: 'Surat Perjanjian' },
    { id: 'ARC-002', member: 'Siti Aminah', loanId: 'PJ-2024-005', date: '2024-09-15', status: 'Verified', type: 'Surat Perjanjian' },
    { id: 'ARC-003', member: 'Hendra Wijaya', loanId: 'PJ-2024-012', date: '2024-10-20', status: 'Verified', type: 'Surat Perjanjian' },
    { id: 'ARC-004', member: 'Dewi Lestari', loanId: 'PJ-2024-018', date: '2024-11-05', status: 'Verified', type: 'Surat Perjanjian' },
    { id: 'ARC-005', member: 'M. Yusuf', loanId: 'PJ-2024-025', date: '2024-12-12', status: 'Verified', type: 'Surat Perjanjian' },
  ];

  const filteredArchives = archives.filter(a => 
    a.member.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.loanId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRefresh = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsLoading(false);
  };

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
          <button className="flex items-center gap-2 px-6 py-2 bg-imigrasi-primary text-white rounded-xl text-sm font-bold hover:bg-blue-900 transition-colors shadow-lg shadow-imigrasi-primary/20">
            <Download size={18} />
            Export Data Arsip
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-3xl border-l-4 border-blue-500">
          <div className="flex items-center gap-3 mb-2">
            <Archive className="text-blue-500" size={20} />
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Total Dokumen</span>
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-white">124</p>
        </div>
        <div className="glass-card p-6 rounded-3xl border-l-4 border-emerald-500">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="text-emerald-500" size={20} />
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Terverifikasi</span>
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-white">124</p>
        </div>
        <div className="glass-card p-6 rounded-3xl border-l-4 border-amber-500">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="text-amber-500" size={20} />
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Menunggu Scan</span>
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-white">0</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="glass-card p-4 rounded-3xl flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Cari nama anggota atau ID pinjaman..." 
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

      {/* Archives Table */}
      <div className="glass-card rounded-[2.5rem] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-neutral-800/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-bold">Dokumen</th>
                <th className="px-6 py-4 font-bold">Anggota</th>
                <th className="px-6 py-4 font-bold">ID Pinjaman</th>
                <th className="px-6 py-4 font-bold">Tanggal Arsip</th>
                <th className="px-6 py-4 font-bold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-700">
              {filteredArchives.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-neutral-700/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
                        <FileText size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{item.type}</p>
                        <p className="text-[10px] text-gray-500 font-mono">{item.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-gray-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{item.member}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-gray-600 dark:text-gray-300">{item.loanId}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-gray-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{item.date}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 text-gray-400 hover:text-imigrasi-primary transition-colors" title="Lihat Dokumen">
                        <Eye size={18} />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-imigrasi-primary transition-colors" title="Download">
                        <Download size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

export default LoanArchives;
