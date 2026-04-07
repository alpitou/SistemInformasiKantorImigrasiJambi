import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  Wallet, 
  HandCoins, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  PieChart, 
  Activity, 
  ShieldCheck, 
  FileText, 
  Calendar, 
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  Cell,
  PieChart as RePieChart,
  Pie
} from 'recharts';

const AdminDashboard: React.FC = () => {
  const [viewType, setViewType] = useState<'monthly' | 'annual'>('monthly');
  const navigate = useNavigate();

  const stats = viewType === 'monthly' ? [
    { label: 'Total Anggota', value: '245', icon: Users, color: 'bg-blue-500', trend: '+12' },
    { label: 'Total Simpanan', value: 'Rp 1.25M', icon: Wallet, color: 'bg-emerald-500', trend: '+5.2%' },
    { label: 'Total Pinjaman', value: 'Rp 450jt', icon: HandCoins, color: 'bg-amber-500', trend: '-2.1%' },
    { label: 'Total SHU 2025', value: 'Rp 250jt', icon: TrendingUp, color: 'bg-purple-500', trend: '+15%' },
  ] : [
    { label: 'Total Anggota (YTD)', value: '245', icon: Users, color: 'bg-blue-500', trend: '+45' },
    { label: 'Total Simpanan (YTD)', value: 'Rp 15.2M', icon: Wallet, color: 'bg-emerald-500', trend: '+12.5%' },
    { label: 'Total Pinjaman (YTD)', value: 'Rp 5.4M', icon: HandCoins, color: 'bg-amber-500', trend: '+8.1%' },
    { label: 'Total SHU (YTD)', value: 'Rp 2.1M', icon: TrendingUp, color: 'bg-purple-500', trend: '+22%' },
  ];

  const chartData = viewType === 'monthly' ? [
    { name: 'Jan', simpanan: 4000, pinjaman: 2400 },
    { name: 'Feb', simpanan: 3000, pinjaman: 1398 },
    { name: 'Mar', simpanan: 2000, pinjaman: 9800 },
    { name: 'Apr', simpanan: 2780, pinjaman: 3908 },
    { name: 'May', simpanan: 1890, pinjaman: 4800 },
    { name: 'Jun', simpanan: 2390, pinjaman: 3800 },
  ] : [
    { name: '2020', simpanan: 40000, pinjaman: 24000 },
    { name: '2021', simpanan: 30000, pinjaman: 13980 },
    { name: '2022', simpanan: 20000, pinjaman: 98000 },
    { name: '2023', simpanan: 27800, pinjaman: 39080 },
    { name: '2024', simpanan: 18900, pinjaman: 48000 },
    { name: '2025', simpanan: 23900, pinjaman: 38000 },
  ];

  const pieData = [
    { name: 'Pokok', value: 400 },
    { name: 'Wajib', value: 300 },
    { name: 'Sukarela', value: 300 },
  ];

  const COLORS = ['#002855', '#C5A059', '#1A1A1A'];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Executive Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">Ringkasan performa dan kesehatan keuangan Koperasi Kanim Jambi.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-3 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-500 hover:text-imigrasi-primary transition-colors">
            <RefreshCw size={18} />
          </button>
          <div className="flex items-center bg-gray-100 dark:bg-neutral-800 p-1 rounded-xl">
            <button 
              onClick={() => setViewType('monthly')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                viewType === 'monthly' ? "bg-white dark:bg-neutral-700 shadow-sm text-imigrasi-primary dark:text-white" : "text-gray-500"
              )}
            >
              Bulanan
            </button>
            <button 
              onClick={() => setViewType('annual')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                viewType === 'annual' ? "bg-white dark:bg-neutral-700 shadow-sm text-imigrasi-primary dark:text-white" : "text-gray-500"
              )}
            >
              Tahunan
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="glass-card p-6 rounded-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <stat.icon size={80} />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 ${stat.color}/10 rounded-lg text-white ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.label}</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</h3>
            <div className="mt-4 flex items-center gap-1 text-xs font-bold text-green-500">
              <ArrowUpRight size={14} />
              <span>{stat.trend}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 glass-card p-8 rounded-[2.5rem] space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">Tren Simpanan vs Pinjaman</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-imigrasi-primary rounded-full" />
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Simpanan</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-imigrasi-accent rounded-full" />
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Pinjaman</span>
              </div>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSimpanan" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#002855" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#002855" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPinjaman" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C5A059" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#C5A059" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#999' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#999' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="simpanan" stroke="#002855" strokeWidth={3} fillOpacity={1} fill="url(#colorSimpanan)" />
                <Area type="monotone" dataKey="pinjaman" stroke="#C5A059" strokeWidth={3} fillOpacity={1} fill="url(#colorPinjaman)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Composition Chart */}
        <div className="glass-card p-8 rounded-[2.5rem] space-y-6">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white">Komposisi Simpanan</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RePieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-4">
            {pieData.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{item.name}</span>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 glass-card rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-neutral-700 flex items-center justify-between">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">Aktivitas Terbaru</h3>
            <button className="text-xs font-bold text-imigrasi-primary dark:text-imigrasi-accent hover:underline">Lihat Semua</button>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-neutral-700">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-neutral-700/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-imigrasi-primary/5 dark:bg-white/5 rounded-2xl flex items-center justify-center text-imigrasi-primary dark:text-white">
                    {i % 2 === 0 ? <Wallet size={24} /> : <HandCoins size={24} />}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">
                      {i % 2 === 0 ? 'Simpanan Wajib Masuk' : 'Pengajuan Pinjaman Baru'}
                    </h4>
                    <p className="text-xs text-gray-500">Oleh: Anggota Ke-{i} • 2 jam yang lalu</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(i * 1000000)}</p>
                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Berhasil</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="space-y-6">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white">Pintasan Admin</h3>
          <div className="grid grid-cols-1 gap-4">
            <button 
              onClick={() => navigate('/admin/approvals')}
              className="flex items-center gap-4 p-4 glass-card rounded-2xl hover:border-imigrasi-accent transition-all group"
            >
              <div className="p-3 bg-blue-100 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                <ShieldCheck size={20} />
              </div>
              <div className="text-left">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">Verifikasi Anggota</h4>
                <p className="text-[10px] text-gray-500">12 antrean menunggu</p>
              </div>
            </button>
            <button 
              onClick={() => navigate('/admin/reports')}
              className="flex items-center gap-4 p-4 glass-card rounded-2xl hover:border-imigrasi-accent transition-all group"
            >
              <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
                <FileText size={20} />
              </div>
              <div className="text-left">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">Laporan Keuangan</h4>
                <p className="text-[10px] text-gray-500">Generate laporan Maret</p>
              </div>
            </button>
            <button 
              onClick={() => navigate('/admin/audit-log')}
              className="flex items-center gap-4 p-4 glass-card rounded-2xl hover:border-imigrasi-accent transition-all group"
            >
              <div className="p-3 bg-amber-100 text-amber-600 rounded-xl group-hover:scale-110 transition-transform">
                <Activity size={20} />
              </div>
              <div className="text-left">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">Audit Log</h4>
                <p className="text-[10px] text-gray-500">Pantau aktivitas sistem</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminDashboard;
