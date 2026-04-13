import React from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  PieChart, 
  Wallet, 
  ArrowUpRight, 
  Download, 
  Info, 
  History,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { DUMMY_SAVINGS, DUMMY_SHU } from '../../constants';

const SHU: React.FC = () => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Calculate estimated SHU based on savings participation
  const totalSavings = DUMMY_SAVINGS.total;
  const estimatedSHU = 1250000; // Mock estimation

  const shuAllocation = [
    { label: 'Jasa Modal', percentage: 40, value: estimatedSHU * 0.4, desc: 'Berdasarkan jumlah simpanan Anda.' },
    { label: 'Jasa Anggota', percentage: 30, value: estimatedSHU * 0.3, desc: 'Berdasarkan keaktifan transaksi.' },
    { label: 'Dana Cadangan', percentage: 20, value: estimatedSHU * 0.2, desc: 'Dialokasikan untuk pengembangan koperasi.' },
    { label: 'Dana Pengurus', percentage: 10, value: estimatedSHU * 0.1, desc: 'Apresiasi untuk pengurus koperasi.' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sisa Hasil Usaha (SHU)</h1>
          <p className="text-gray-500 dark:text-gray-400">Pantau pembagian keuntungan dan partisipasi modal Anda.</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-2 bg-imigrasi-primary text-white rounded-xl text-sm font-bold hover:bg-blue-900 transition-colors shadow-lg shadow-imigrasi-primary/20">
          <Download size={18} />
          Download Sertifikat SHU
        </button>
      </div>

      {/* SHU Summary Card */}
      <div className="glass-card p-8 rounded-[2.5rem] bg-gradient-to-br from-purple-600 to-indigo-900 text-white border-none relative overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <p className="text-white/60 text-sm font-bold uppercase tracking-widest mb-2">Estimasi SHU Tahun Buku 2025</p>
            <h2 className="text-4xl md:text-5xl font-black">{formatCurrency(estimatedSHU)}</h2>
            <div className="mt-4 flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <TrendingUp size={18} />
              <span>+12% dari tahun sebelumnya</span>
            </div>
          </div>
          <div className="p-6 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20">
            <div className="flex items-center gap-3 mb-4">
              <PieChart className="text-imigrasi-accent" size={24} />
              <span className="font-bold">Partisipasi Modal</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Total Simpanan</span>
                <span className="font-bold">{formatCurrency(totalSavings)}</span>
              </div>
              <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                <div className="bg-imigrasi-accent h-full w-[85%]" />
              </div>
              <p className="text-[10px] text-white/40 text-right">Skor Partisipasi: 85/100</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* SHU Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white">Rincian Alokasi SHU</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shuAllocation.map((item) => (
              <div key={item.label} className="glass-card p-6 rounded-3xl hover:border-imigrasi-accent transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-xl">
                    <TrendingUp size={20} />
                  </div>
                  <span className="text-xs font-black text-purple-600 dark:text-purple-400">{item.percentage}%</span>
                </div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-1">{item.label}</h4>
                <p className="text-xl font-black text-imigrasi-primary dark:text-white mb-2">{formatCurrency(item.value)}</p>
                <p className="text-[10px] text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Historical SHU */}
          <div className="glass-card rounded-3xl overflow-hidden mt-8">
            <div className="p-6 border-b border-gray-100 dark:border-neutral-700">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">Riwayat Penerimaan SHU</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 dark:bg-neutral-800/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                    <th className="px-6 py-4 font-bold">Tahun Buku</th>
                    <th className="px-6 py-4 font-bold">Jumlah Diterima</th>
                    <th className="px-6 py-4 font-bold">Partisipasi</th>
                    <th className="px-6 py-4 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-neutral-700">
                  {DUMMY_SHU.map((item) => (
                    <tr key={item.year} className="hover:bg-gray-50 dark:hover:bg-neutral-700/30 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{item.year}</td>
                      <td className="px-6 py-4 text-sm font-bold text-emerald-600">{formatCurrency(item.amount)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-100 dark:bg-neutral-700 rounded-full overflow-hidden max-w-[100px]">
                            <div className="bg-blue-500 h-full" style={{ width: `${item.participation}%` }} />
                          </div>
                          <span className="text-xs text-gray-500">{item.participation}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wider">
                          Sudah Cair
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Info Sidebar */}
        <div className="space-y-8">
          <div className="glass-card p-6 rounded-3xl bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/30">
            <div className="flex items-center gap-3 mb-4">
              <Info className="text-amber-600" size={20} />
              <h4 className="font-bold text-amber-900 dark:text-amber-400">Tentang SHU</h4>
            </div>
            <p className="text-xs text-amber-800 dark:text-amber-500/80 leading-relaxed mb-4">
              Sisa Hasil Usaha (SHU) adalah pendapatan koperasi yang diperoleh dalam satu tahun buku dikurangi dengan biaya, penyusutan, dan kewajiban lainnya.
            </p>
            <ul className="space-y-3">
              <li className="flex gap-2 text-[10px] text-amber-700 dark:text-amber-600">
                <CheckCircle2 size={14} className="shrink-0" />
                <span>Dibagikan secara adil berdasarkan partisipasi modal.</span>
              </li>
              <li className="flex gap-2 text-[10px] text-amber-700 dark:text-amber-600">
                <CheckCircle2 size={14} className="shrink-0" />
                <span>Dihitung setelah Rapat Anggota Tahunan (RAT).</span>
              </li>
              <li className="flex gap-2 text-[10px] text-amber-700 dark:text-amber-600">
                <CheckCircle2 size={14} className="shrink-0" />
                <span>Dapat dicairkan atau ditambahkan ke Simpanan Sukarela.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SHU;
