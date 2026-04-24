import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, PieChart, Wallet, ArrowUpRight, Download, Info, 
  History, CheckCircle2, AlertCircle, RefreshCw
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import api from '../../services/api';

interface SHUData {
  id: number;
  year: number;
  total_shu: number;
  member_share_percentage: number;
  member_share_amount: number;
  reserve_percentage: number;
  reserve_amount: number;
  kantin_contribution: number;
  interest_income: number;
  operational_cost: number;
  processed_at: string;
  processor: { name: string };
}

interface UserSHU {
  year: number;
  amount: number;
  description: string;
  created_at: string;
}

const SHU: React.FC = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [isLoading, setIsLoading] = useState(false);
  const [shuHistory, setShuHistory] = useState<SHUData[]>([]);
  const [userSHU, setUserSHU] = useState<UserSHU[]>([]);
  const [currentYearSHU, setCurrentYearSHU] = useState<number>(0);
  const [totalSavings, setTotalSavings] = useState(0);

  const formatCurrency = (amount: number) => {
    if (isNaN(amount) || amount === null || amount === undefined) {
      return 'Rp 0';
    }
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const fetchSHUHistory = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/savings/financial/shu/history');
      if (response.data.success) {
        setShuHistory(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch SHU history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserSHU = async () => {
    try {
      const response = await api.get('/savings');
      if (response.data.success) {
        const shuTransactions = response.data.data.filter(
          (item: any) => item.description?.includes('Pembagian SHU')
        );
        setUserSHU(shuTransactions);
        
        // Hitung total SHU tahun ini
        const currentYear = new Date().getFullYear();
        const currentYearTotal = shuTransactions
          .filter((item: any) => new Date(item.created_at).getFullYear() === currentYear)
          .reduce((sum: number, item: any) => sum + item.amount, 0);
        setCurrentYearSHU(currentYearTotal);
      }
    } catch (error) {
      console.error('Failed to fetch user SHU:', error);
    }
  };

  const fetchTotalSavings = async () => {
    try {
      const userStr = localStorage.getItem('user');
      const currentUser = userStr ? JSON.parse(userStr) : null;
      const userId = currentUser?.id || user?.id;
      
      if (userId) {
        const response = await api.get(`/savings/summary/${userId}`);
        if (response.data.success) {
          setTotalSavings(response.data.data.total || 0);
        }
      }
    } catch (error) {
      console.error('Failed to fetch total savings:', error);
    }
  };

  useEffect(() => {
    fetchSHUHistory();
    fetchUserSHU();
    fetchTotalSavings();
  }, []);

  // Hitung estimasi SHU berdasarkan data terakhir
  const latestSHU = shuHistory[0];
  const estimatedSHU = latestSHU?.total_shu || currentYearSHU || 0;
  
  const shuAllocation = latestSHU ? [
    { label: 'Jasa Anggota', percentage: latestSHU.member_share_percentage, value: latestSHU.member_share_amount, desc: 'Berdasarkan jumlah simpanan Anda.' },
    { label: 'Cadangan', percentage: latestSHU.reserve_percentage, value: latestSHU.reserve_amount, desc: 'Dialokasikan untuk pengembangan koperasi.' },
  ] : [
    { label: 'Jasa Anggota', percentage: 60, value: estimatedSHU * 0.6, desc: 'Berdasarkan jumlah simpanan Anda.' },
    { label: 'Cadangan', percentage: 40, value: estimatedSHU * 0.4, desc: 'Dialokasikan untuk pengembangan koperasi.' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sisa Hasil Usaha (SHU)</h1>
          <p className="text-gray-500 dark:text-gray-400">Pantau pembagian keuntungan dan partisipasi modal Anda.</p>
        </div>
        <button 
          onClick={() => { fetchSHUHistory(); fetchUserSHU(); fetchTotalSavings(); }}
          className="p-3 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-500 hover:text-imigrasi-primary transition-colors"
        >
          <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* SHU Summary Card */}
      <div className="glass-card p-8 rounded-[2.5rem] bg-gradient-to-br from-purple-600 to-indigo-900 text-white border-none relative overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <p className="text-white/60 text-sm font-bold uppercase tracking-widest mb-2">
              {latestSHU ? `SHU Tahun Buku ${latestSHU.year}` : 'Estimasi SHU Tahun Ini'}
            </p>
            <h2 className="text-4xl md:text-5xl font-black">{formatCurrency(estimatedSHU)}</h2>
            {latestSHU && (
              <p className="text-xs text-white/40 mt-2">Diproses: {formatDate(latestSHU.processed_at)}</p>
            )}
          </div>
          <div className="p-6 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20">
            <div className="flex items-center gap-3 mb-4">
              <PieChart className="text-imigrasi-accent" size={24} />
              <span className="font-bold">Partisipasi Modal</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Total Simpanan Anda</span>
                <span className="font-bold">{formatCurrency(totalSavings)}</span>
              </div>
              <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                <div className="bg-imigrasi-accent h-full" style={{ width: `${Math.min(100, (totalSavings / 10000000) * 100)}%` }} />
              </div>
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

          {/* Riwayat SHU yang Diterima */}
          <div className="glass-card rounded-3xl overflow-hidden mt-8">
            <div className="p-6 border-b border-gray-100 dark:border-neutral-700">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">Riwayat SHU yang Diterima</h3>
            </div>
            <div className="overflow-x-auto">
              {userSHU.length === 0 ? (
                <div className="p-12 text-center">
                  <Wallet size={48} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">Belum ada riwayat SHU</p>
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-neutral-800/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                      <th className="px-6 py-4 font-bold">Tanggal</th>
                      <th className="px-6 py-4 font-bold">Tahun Buku</th>
                      <th className="px-6 py-4 font-bold text-right">Jumlah Diterima</th>
                      <th className="px-6 py-4 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-neutral-700">
                    {userSHU.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-neutral-700/30 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                          {formatDate(item.created_at)}
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                          {item.description?.match(/\d{4}/)?.[0] || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-right font-bold text-emerald-600">
                          {formatCurrency(item.amount)}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wider">
                            Sudah Cair
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 dark:bg-neutral-800/50 font-bold">
                      <td colSpan={2} className="px-6 py-4 text-right">Total SHU Diterima</td>
                      <td className="px-6 py-4 text-right text-emerald-600">
                        {formatCurrency(userSHU.reduce((sum, item) => sum + item.amount, 0))}
                      </td>
                      <td className="px-6 py-4"></td>
                    </tr>
                  </tfoot>
                </table>
              )}
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
                <span>Langsung ditambahkan ke Simpanan Sukarela Anda.</span>
              </li>
            </ul>
          </div>

          {/* Riwayat SHU Koperasi */}
          {shuHistory.length > 0 && (
            <div className="glass-card p-6 rounded-3xl">
              <h4 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <History size={16} /> Riwayat SHU Koperasi
              </h4>
              <div className="space-y-3">
                {shuHistory.slice(0, 5).map((shu) => (
                  <div key={shu.id} className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{shu.year}</p>
                      <p className="text-[10px] text-gray-400">{formatDate(shu.processed_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-purple-600">{formatCurrency(shu.total_shu)}</p>
                      <p className="text-[10px] text-gray-400">SHU Total</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default SHU;