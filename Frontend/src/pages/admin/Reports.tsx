import React, { useState } from 'react';
import { motion } from 'motion/react';
import { FileText, Download, PieChart, TrendingUp, Calendar, Filter, FileSpreadsheet, FileCheck, RefreshCw, Share2, MessageCircle, Info } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { cn } from '../../lib/utils';

const ReportsPage: React.FC = () => {
  const { addNotification } = useNotifications();
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportFilter, setReportFilter] = useState('Semua');
  
  const reports = [
    { id: 'REP-001', title: 'Laporan Laba Rugi Semester I 2025', type: 'Keuangan', date: '2025-07-15', status: 'Final' },
    { id: 'REP-002', title: 'Neraca Keuangan Tahunan 2024', type: 'Keuangan', date: '2025-01-10', status: 'Final' },
    { id: 'REP-003', title: 'Laporan Arus Kas Bulanan (Maret 2026)', type: 'Operasional', date: '2026-04-01', status: 'Draft' },
    { id: 'REP-004', title: 'Daftar Piutang Anggota (Maret 2026)', type: 'Piutang', date: '2026-04-01', status: 'Final' },
    { id: 'REP-005', title: 'Laporan Partisipasi Simpanan Anggota', type: 'Simpanan', date: '2026-03-31', status: 'Final' },
  ];

  const handleSendWhatsApp = (title: string) => {
    addNotification({
      title: 'Laporan Dikirim',
      message: `Laporan "${title}" sedang dikirim ke WhatsApp anggota.`,
      type: 'success'
    });
    // Simulate WhatsApp API call
    console.log(`Sending report "${title}" to WhatsApp members...`);
  };

  const handleGenerateSINTA = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      addNotification({
        title: 'Laporan SINTA Selesai',
        message: 'Laporan keuangan format SINTA telah berhasil dibuat.',
        type: 'success'
      });
    }, 2000);
  };

  const filteredReports = reports.filter(r => 
    reportFilter === 'Semua' || r.type === reportFilter
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Laporan Bulanan</h1>
          <p className="text-gray-500 dark:text-gray-400">Unduh laporan keuangan bulanan koperasi dalam format PDF/Excel.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-3 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-500 hover:text-imigrasi-primary transition-colors">
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      <div className="glass-card rounded-[2.5rem] overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-neutral-700 flex items-center justify-between">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white">Daftar Laporan Tersedia</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <select 
                className="pl-9 pr-8 py-2 bg-gray-100 dark:bg-neutral-700 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 outline-none appearance-none border-none"
              >
                <option>Tahun 2026</option>
                <option>Tahun 2025</option>
              </select>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-neutral-800/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-bold">Bulan & Tahun</th>
                <th className="px-6 py-4 font-bold">Jenis Laporan</th>
                <th className="px-6 py-4 font-bold">Tanggal Terbit</th>
                <th className="px-6 py-4 font-bold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-700">
              {[
                { month: 'Maret 2026', type: 'Laporan Keuangan Bulanan', date: '01 Apr 2026' },
                { month: 'Februari 2026', type: 'Laporan Keuangan Bulanan', date: '01 Mar 2026' },
                { month: 'Januari 2026', type: 'Laporan Keuangan Bulanan', date: '01 Feb 2026' },
                { month: 'Desember 2025', type: 'Laporan Keuangan Bulanan', date: '01 Jan 2026' },
                { month: 'November 2025', type: 'Laporan Keuangan Bulanan', date: '01 Des 2025' },
              ].map((report, idx) => (
                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-neutral-700/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-imigrasi-primary dark:text-imigrasi-accent rounded-lg">
                        <FileText size={18} />
                      </div>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{report.month}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{report.type}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{report.date}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => {
                          addNotification({
                            title: 'Download Dimulai',
                            message: `Laporan ${report.month} sedang diunduh.`,
                            type: 'success'
                          });
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-imigrasi-primary text-white rounded-xl text-xs font-bold hover:bg-blue-900 transition-all shadow-lg shadow-imigrasi-primary/20"
                      >
                        <Download size={14} />
                        Unduh PDF
                      </button>
                      <button className="p-2 text-gray-400 hover:text-emerald-500 transition-colors">
                        <MessageCircle size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-[2rem] border border-blue-100 dark:border-blue-900/30 flex gap-4 items-center">
        <div className="p-3 bg-white dark:bg-neutral-800 rounded-2xl text-imigrasi-primary shadow-sm">
          <Info size={24} />
        </div>
        <div>
          <h4 className="font-bold text-blue-900 dark:text-blue-400">Informasi Laporan</h4>
          <p className="text-xs text-blue-800 dark:text-blue-500/80 leading-relaxed">
            Laporan bulanan diterbitkan setiap tanggal 1 pada bulan berikutnya. Jika Anda memerlukan laporan khusus atau data akuntansi lebih detail, silakan hubungi Bendahara Koperasi.
          </p>
        </div>
      </div>
    </motion.div>
  );
};

const Plus = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

export default ReportsPage;
