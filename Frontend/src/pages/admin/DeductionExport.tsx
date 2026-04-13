import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Download, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Wallet, 
  RefreshCw,
  FileSpreadsheet,
  ArrowUpRight,
  CheckCircle2
} from 'lucide-react';

const DeductionExport: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('2026-03');

  const deductions = [
    { id: '1', name: 'Budi Santoso', nip: '198501012010011001', pokok: 100000, wajib: 50000, sukarela: 200000, total: 350000 },
    { id: '2', name: 'Siti Aminah', nip: '197805122005012002', pokok: 100000, wajib: 50000, sukarela: 150000, total: 300000 },
    { id: '3', name: 'Hendra Wijaya', nip: '198203152008011003', pokok: 100000, wajib: 50000, sukarela: 500000, total: 650000 },
    { id: '4', name: 'Dewi Lestari', nip: '198005202006042001', pokok: 100000, wajib: 50000, sukarela: 100000, total: 250000 },
    { id: '5', name: 'M. Yusuf', nip: '197001011995031001', pokok: 100000, wajib: 50000, sukarela: 0, total: 150000 },
  ];

  const filteredDeductions = deductions.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.nip.includes(searchTerm)
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsLoading(false);
  };

  const handleExport = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      // Simulate export
      alert('Data potongan bulan ' + selectedMonth + ' berhasil diekspor ke Excel.');
    }, 1500);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ekspor Potongan Bulanan</h1>
          <p className="text-gray-500 dark:text-gray-400">Generate data potongan iuran wajib, pokok, dan sukarela untuk bendahara gaji.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleRefresh}
            className="p-3 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-500 hover:text-imigrasi-primary transition-colors"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={handleExport}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20 disabled:opacity-70"
          >
            {isLoading ? <RefreshCw className="animate-spin" size={18} /> : <FileSpreadsheet size={18} />}
            Ekspor ke Excel
          </button>
        </div>
      </div>

      {/* Month Selector & Search */}
      <div className="glass-card p-6 rounded-[2.5rem] space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Pilih Bulan</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="month" 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-2xl outline-none transition-all dark:text-white"
              />
            </div>
          </div>
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Cari Anggota</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Cari nama atau NIP..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-2xl outline-none transition-all dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Deductions Table */}
      <div className="glass-card rounded-[2.5rem] overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-neutral-700 flex items-center justify-between">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white">Daftar Potongan Iuran - {selectedMonth}</h3>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
            <CheckCircle2 size={14} />
            Data Siap Ekspor
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-neutral-800/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-bold">Anggota</th>
                <th className="px-6 py-4 font-bold">NIP</th>
                <th className="px-6 py-4 font-bold text-right">Iuran Pokok</th>
                <th className="px-6 py-4 font-bold text-right">Iuran Wajib</th>
                <th className="px-6 py-4 font-bold text-right">Iuran Sukarela</th>
                <th className="px-6 py-4 font-bold text-right">Total Potongan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-700">
              {filteredDeductions.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-neutral-700/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-gray-400" />
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{item.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-gray-600 dark:text-gray-300">{item.nip}</td>
                  <td className="px-6 py-4 text-sm text-right text-gray-700 dark:text-gray-300">{formatCurrency(item.pokok)}</td>
                  <td className="px-6 py-4 text-sm text-right text-gray-700 dark:text-gray-300">{formatCurrency(item.wajib)}</td>
                  <td className="px-6 py-4 text-sm text-right text-gray-700 dark:text-gray-300">{formatCurrency(item.sukarela)}</td>
                  <td className="px-6 py-4 text-sm text-right font-bold text-imigrasi-primary dark:text-white">{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 dark:bg-neutral-800/50 font-bold">
                <td colSpan={2} className="px-6 py-4 text-sm text-gray-900 dark:text-white">TOTAL KESELURUHAN</td>
                <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-white">{formatCurrency(deductions.reduce((acc, curr) => acc + curr.pokok, 0))}</td>
                <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-white">{formatCurrency(deductions.reduce((acc, curr) => acc + curr.wajib, 0))}</td>
                <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-white">{formatCurrency(deductions.reduce((acc, curr) => acc + curr.sukarela, 0))}</td>
                <td className="px-6 py-4 text-sm text-right text-imigrasi-primary dark:text-white">{formatCurrency(deductions.reduce((acc, curr) => acc + curr.total, 0))}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Info Box */}
      <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-[2rem] border border-blue-100 dark:border-blue-900/30 flex items-start gap-4">
        <div className="p-3 bg-blue-500 text-white rounded-2xl shadow-lg shadow-blue-500/20">
          <ArrowUpRight size={24} />
        </div>
        <div>
          <h4 className="font-bold text-blue-900 dark:text-blue-400">Instruksi Ekspor</h4>
          <p className="text-sm text-blue-800 dark:text-blue-500/80 mt-1 leading-relaxed">
            Data ini digunakan untuk pemotongan gaji otomatis setiap bulan. Pastikan semua simpanan sukarela anggota telah diinput sebelum melakukan ekspor. File Excel yang dihasilkan dapat langsung diunggah ke sistem penggajian.
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default DeductionExport;
