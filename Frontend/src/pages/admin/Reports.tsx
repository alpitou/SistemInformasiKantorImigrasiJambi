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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Laporan & RAT</h1>
          <p className="text-gray-500 dark:text-gray-400">Pusat pelaporan keuangan, operasional, dan berkas Rapat Anggota Tahunan.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-3 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-500 hover:text-imigrasi-primary transition-colors">
            <RefreshCw size={18} />
          </button>
          <button className="flex items-center gap-2 px-6 py-2 bg-imigrasi-primary text-white rounded-xl text-sm font-bold hover:bg-blue-900 transition-colors shadow-lg shadow-imigrasi-primary/20">
            <Plus size={18} />
            Buat Laporan Baru
          </button>
        </div>
      </div>

      {/* Report Types Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6 rounded-3xl flex items-center gap-4 hover:border-imigrasi-accent transition-all cursor-pointer group">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform">
            <PieChart size={24} />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white">Neraca</h4>
            <p className="text-xs text-gray-500">Posisi Keuangan</p>
          </div>
        </div>
        <div className="glass-card p-6 rounded-3xl flex items-center gap-4 hover:border-imigrasi-accent transition-all cursor-pointer group">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform">
            <TrendingUp size={24} />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white">Laba Rugi</h4>
            <p className="text-xs text-gray-500">Hasil Usaha</p>
          </div>
        </div>
        <div className="glass-card p-6 rounded-3xl flex items-center gap-4 hover:border-imigrasi-accent transition-all cursor-pointer group">
          <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl group-hover:scale-110 transition-transform">
            <FileSpreadsheet size={24} />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white">Arus Kas</h4>
            <p className="text-xs text-gray-500">Aliran Dana</p>
          </div>
        </div>
        <div className="glass-card p-6 rounded-3xl flex items-center gap-4 hover:border-imigrasi-accent transition-all cursor-pointer group">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-2xl group-hover:scale-110 transition-transform">
            <FileCheck size={24} />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white">RAT</h4>
            <p className="text-xs text-gray-500">Berkas Tahunan</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Reports */}
        <div className="lg:col-span-2 glass-card rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-neutral-700 flex items-center justify-between">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">Arsip Laporan</h3>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <select 
                  value={reportFilter}
                  onChange={(e) => setReportFilter(e.target.value)}
                  className="pl-9 pr-8 py-2 bg-gray-100 dark:bg-neutral-700 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 outline-none appearance-none border-none"
                >
                  <option value="Semua">Semua Tipe</option>
                  <option value="Keuangan">Keuangan</option>
                  <option value="Operasional">Operasional</option>
                  <option value="Piutang">Piutang</option>
                  <option value="Simpanan">Simpanan</option>
                </select>
              </div>
            </div>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-neutral-700">
            {filteredReports.map((report) => (
              <div key={report.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-neutral-700/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-imigrasi-primary/5 dark:bg-white/5 rounded-2xl flex items-center justify-center text-imigrasi-primary dark:text-white">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">{report.title}</h4>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] font-bold text-imigrasi-accent uppercase tracking-wider">{report.type}</span>
                      <span className="text-[10px] text-gray-400">•</span>
                      <span className="text-[10px] text-gray-500">{report.date}</span>
                      <span className="text-[10px] text-gray-400">•</span>
                      <span className={`text-[10px] font-bold ${report.status === 'Final' ? 'text-green-500' : 'text-amber-500'}`}>{report.status}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-neutral-700 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 transition-colors">
                    <Download size={14} />
                    Unduh
                  </button>
                  <button 
                    onClick={() => handleSendWhatsApp(report.title)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-600 rounded-xl text-xs font-bold hover:bg-emerald-500 hover:text-white transition-colors"
                  >
                    <MessageCircle size={14} />
                    WA Anggota
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Report Generator Sidebar */}
        <div className="space-y-8">
          <div className="glass-card p-6 rounded-3xl space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-gray-900 dark:text-white">Generate Laporan Cepat</h4>
              <div className="p-1.5 bg-imigrasi-accent/20 text-imigrasi-primary rounded-lg">
                <Info size={14} />
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500">Jenis Laporan</label>
                <select className="w-full p-3 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-xl outline-none text-sm dark:text-white">
                  <option>Laporan Kas Bulanan</option>
                  <option>Laporan Piutang Anggota</option>
                  <option>Laporan Simpanan Wajib</option>
                  <option>Laporan SHU Per Anggota</option>
                  <option>Template SINTA (Keuangan)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500">Periode</label>
                <div className="grid grid-cols-2 gap-2">
                  <input type="month" className="p-3 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-xl outline-none text-xs dark:text-white" />
                  <input type="month" className="p-3 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-xl outline-none text-xs dark:text-white" />
                </div>
              </div>
              <button 
                onClick={handleGenerateSINTA}
                disabled={isGenerating}
                className={cn(
                  "w-full py-3 bg-imigrasi-primary text-white font-bold rounded-xl hover:bg-blue-900 transition-all shadow-lg shadow-imigrasi-primary/20 flex items-center justify-center gap-2",
                  isGenerating && "opacity-70 cursor-not-allowed"
                )}
              >
                <RefreshCw size={16} className={cn(isGenerating && "animate-spin")} />
                {isGenerating ? 'Generating...' : 'Generate Laporan'}
              </button>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-900/30">
              <p className="text-[10px] text-blue-800 dark:text-blue-400 leading-relaxed">
                <span className="font-bold">Info SINTA:</span> Pilih "Template SINTA" untuk menghasilkan laporan keuangan yang sesuai dengan standar pengajuan aplikasi SINTA.
              </p>
            </div>
          </div>

          <div className="glass-card p-6 rounded-3xl bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30">
            <div className="flex items-center gap-3 mb-4">
              <Calendar size={20} className="text-emerald-600" />
              <h4 className="font-bold text-emerald-900 dark:text-emerald-400">Jadwal RAT 2026</h4>
            </div>
            <p className="text-xs text-emerald-800 dark:text-emerald-500/80 leading-relaxed mb-4">
              Rapat Anggota Tahunan (RAT) untuk Tahun Buku 2025 direncanakan akan dilaksanakan pada:
            </p>
            <div className="p-3 bg-white dark:bg-neutral-800 rounded-xl border border-emerald-100 dark:border-emerald-900/30 text-center">
              <p className="text-sm font-bold text-emerald-600">Sabtu, 14 Maret 2026</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">Aula Kanim Jambi</p>
            </div>
          </div>
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
