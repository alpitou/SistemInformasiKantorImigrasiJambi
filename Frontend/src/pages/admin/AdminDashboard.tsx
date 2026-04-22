import React, { useState, useEffect } from 'react';
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
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
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
import axios from 'axios';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [viewType, setViewType] = useState<'monthly' | 'annual'>('monthly');
  const [stats, setStats] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [pieData, setPieData] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [quickLinks, setQuickLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  const getAxiosInstance = () => {
    const token = localStorage.getItem('token');
    return axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const axiosInstance = getAxiosInstance();
      
      const [statsRes, chartRes, compositionRes, activitiesRes, linksRes] = await Promise.all([
        axiosInstance.get('/dashboard/stats', { params: { view_type: viewType } }),
        axiosInstance.get('/dashboard/chart', { params: { view_type: viewType } }),
        axiosInstance.get('/dashboard/saving-composition'),
        axiosInstance.get('/dashboard/recent-activities'),
        axiosInstance.get('/dashboard/quick-links')
      ]);

      if (statsRes.data.success) setStats(statsRes.data.data);
      if (chartRes.data.success) setChartData(chartRes.data.data);
      if (compositionRes.data.success) setPieData(compositionRes.data.data);
      if (activitiesRes.data.success) setRecentActivities(activitiesRes.data.data);
      if (linksRes.data.success) setQuickLinks(linksRes.data.data);
      
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      
      // Fallback ke data dummy jika API gagal
      setStats(viewType === 'monthly' ? [
        { label: 'Total Anggota', value: '245', color: 'bg-blue-500', trend: '+12' },
        { label: 'Total Simpanan', value: 'Rp 1.25M', color: 'bg-emerald-500', trend: '+5.2%' },
        { label: 'Total Pinjaman', value: 'Rp 450jt', color: 'bg-amber-500', trend: '-2.1%' },
        { label: 'Total SHU 2025', value: 'Rp 250jt', color: 'bg-purple-500', trend: '+15%' },
      ] : [
        { label: 'Total Anggota (YTD)', value: '245', color: 'bg-blue-500', trend: '+45' },
        { label: 'Total Simpanan (YTD)', value: 'Rp 15.2M', color: 'bg-emerald-500', trend: '+12.5%' },
        { label: 'Total Pinjaman (YTD)', value: 'Rp 5.4M', color: 'bg-amber-500', trend: '+8.1%' },
        { label: 'Total SHU (YTD)', value: 'Rp 2.1M', color: 'bg-purple-500', trend: '+22%' },
      ]);
      
      setChartData(viewType === 'monthly' ? [
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
      ]);
      
      setPieData([
        { name: 'Pokok', value: 40, percentage: 40 },
        { name: 'Wajib', value: 35, percentage: 35 },
        { name: 'Sukarela', value: 25, percentage: 25 },
      ]);
      
      setRecentActivities([
        { id: '1', title: 'Simpanan Wajib Masuk', description: 'Oleh: Anggota Ke-1 • 2 jam yang lalu', amount: 1000000, status: 'Berhasil', status_color: 'text-emerald-500', icon: 'Wallet' },
        { id: '2', title: 'Pengajuan Pinjaman Baru', description: 'Oleh: Anggota Ke-2 • 2 jam yang lalu', amount: 2000000, status: 'Berhasil', status_color: 'text-emerald-500', icon: 'HandCoins' },
        { id: '3', title: 'Simpanan Wajib Masuk', description: 'Oleh: Anggota Ke-3 • 2 jam yang lalu', amount: 3000000, status: 'Berhasil', status_color: 'text-emerald-500', icon: 'Wallet' },
        { id: '4', title: 'Pengajuan Pinjaman Baru', description: 'Oleh: Anggota Ke-4 • 2 jam yang lalu', amount: 4000000, status: 'Berhasil', status_color: 'text-emerald-500', icon: 'HandCoins' },
      ]);
      
      setQuickLinks([
        { title: 'Verifikasi & Persetujuan', description: '12 antrean menunggu', icon: 'ShieldCheck', icon_color: 'bg-blue-100 text-blue-600', route: '/admin/approvals', badge: 12 },
        { title: 'Manajemen Keuangan', description: 'Update kas & simpanan', icon: 'Wallet', icon_color: 'bg-emerald-100 text-emerald-600', route: '/admin/finance', badge: null },
        { title: 'Data Anggota', description: 'Kelola database anggota', icon: 'Users', icon_color: 'bg-purple-100 text-purple-600', route: '/admin/members', badge: null },
        { title: 'Laporan Keuangan', description: 'Generate laporan berkala', icon: 'FileText', icon_color: 'bg-amber-100 text-amber-600', route: '/admin/reports', badge: null },
      ]);
      
      if (addNotification) {
        addNotification({
          title: 'Gagal Memuat Data',
          message: error.response?.data?.message || 'Terjadi kesalahan, menampilkan data demo.',
          type: 'error'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
    
    if (addNotification) {
      addNotification({
        title: 'Data Diperbarui',
        message: 'Dashboard telah diperbarui dengan data terbaru.',
        type: 'success'
      });
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [viewType]);

  const getDashboardTitle = () => {
    switch (user?.role?.name) {
      case 'sekretaris': return 'Dashboard Sekretaris';
      case 'bendahara': return 'Dashboard Bendahara';
      case 'ketua': return 'Dashboard Ketua';
      default: return 'Executive Dashboard';
    }
  };

  const getDashboardDesc = () => {
    switch (user?.role?.name) {
      case 'sekretaris': return 'Kelola administrasi, dokumen, dan verifikasi data anggota.';
      case 'bendahara': return 'Pantau arus kas, simpanan, dan proses pencairan pinjaman.';
      case 'ketua': return 'Tinjau performa koperasi dan berikan persetujuan strategis.';
      default: return 'Ringkasan performa dan kesehatan keuangan Koperasi Kanim Jambi.';
    }
  };

  const getIconComponent = (iconName: string) => {
    const icons: Record<string, React.ElementType> = {
      Wallet: Wallet,
      HandCoins: HandCoins,
      Users: Users,
      ShieldCheck: ShieldCheck,
      FileText: FileText
    };
    return icons[iconName] || Wallet;
  };

  const COLORS = ['#002855', '#C5A059', '#1A1A1A'];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw size={40} className="animate-spin text-imigrasi-primary mx-auto mb-4" />
          <p className="text-gray-500">Memuat data dashboard...</p>
        </div>
      </div>
    );
  }

  // Gunakan data dari state jika ada,否则 fallback ke data dummy
  const displayStats = stats.length > 0 ? stats : (viewType === 'monthly' ? [
    { label: 'Total Anggota', value: '245', color: 'bg-blue-500', trend: '+12' },
    { label: 'Total Simpanan', value: 'Rp 1.25M', color: 'bg-emerald-500', trend: '+5.2%' },
    { label: 'Total Pinjaman', value: 'Rp 450jt', color: 'bg-amber-500', trend: '-2.1%' },
    { label: 'Total SHU 2025', value: 'Rp 250jt', color: 'bg-purple-500', trend: '+15%' },
  ] : [
    { label: 'Total Anggota (YTD)', value: '245', color: 'bg-blue-500', trend: '+45' },
    { label: 'Total Simpanan (YTD)', value: 'Rp 15.2M', color: 'bg-emerald-500', trend: '+12.5%' },
    { label: 'Total Pinjaman (YTD)', value: 'Rp 5.4M', color: 'bg-amber-500', trend: '+8.1%' },
    { label: 'Total SHU (YTD)', value: 'Rp 2.1M', color: 'bg-purple-500', trend: '+22%' },
  ]);

  const displayChartData = chartData.length > 0 ? chartData : (viewType === 'monthly' ? [
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
  ]);

  const displayPieData = pieData.length > 0 ? pieData : [
    { name: 'Pokok', value: 40, percentage: 40 },
    { name: 'Wajib', value: 35, percentage: 35 },
    { name: 'Sukarela', value: 25, percentage: 25 },
  ];

  const displayActivities = recentActivities.length > 0 ? recentActivities : [
    { id: '1', title: 'Simpanan Wajib Masuk', description: 'Oleh: Anggota Ke-1 • 2 jam yang lalu', amount: 1000000, status: 'Berhasil', status_color: 'text-emerald-500', icon: 'Wallet' },
    { id: '2', title: 'Pengajuan Pinjaman Baru', description: 'Oleh: Anggota Ke-2 • 2 jam yang lalu', amount: 2000000, status: 'Berhasil', status_color: 'text-emerald-500', icon: 'HandCoins' },
    { id: '3', title: 'Simpanan Wajib Masuk', description: 'Oleh: Anggota Ke-3 • 2 jam yang lalu', amount: 3000000, status: 'Berhasil', status_color: 'text-emerald-500', icon: 'Wallet' },
    { id: '4', title: 'Pengajuan Pinjaman Baru', description: 'Oleh: Anggota Ke-4 • 2 jam yang lalu', amount: 4000000, status: 'Berhasil', status_color: 'text-emerald-500', icon: 'HandCoins' },
  ];

  const displayQuickLinks = quickLinks.length > 0 ? quickLinks : [
    { title: 'Verifikasi & Persetujuan', description: '12 antrean menunggu', icon: 'ShieldCheck', icon_color: 'bg-blue-100 text-blue-600', route: '/admin/approvals', badge: 12 },
    { title: 'Manajemen Keuangan', description: 'Update kas & simpanan', icon: 'Wallet', icon_color: 'bg-emerald-100 text-emerald-600', route: '/admin/finance', badge: null },
    { title: 'Data Anggota', description: 'Kelola database anggota', icon: 'Users', icon_color: 'bg-purple-100 text-purple-600', route: '/admin/members', badge: null },
    { title: 'Laporan Keuangan', description: 'Generate laporan berkala', icon: 'FileText', icon_color: 'bg-amber-100 text-amber-600', route: '/admin/reports', badge: null },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{getDashboardTitle()}</h1>
          <p className="text-gray-500 dark:text-gray-400">{getDashboardDesc()}</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-3 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-500 hover:text-imigrasi-primary transition-colors"
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
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
        {displayStats.map((stat, index) => (
          <div key={stat.label} className="glass-card p-6 rounded-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              {index === 0 && <Users size={80} />}
              {index === 1 && <Wallet size={80} />}
              {index === 2 && <HandCoins size={80} />}
              {index === 3 && <TrendingUp size={80} />}
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 ${stat.color}/10 rounded-lg text-white ${stat.color}`}>
                {index === 0 && <Users size={20} />}
                {index === 1 && <Wallet size={20} />}
                {index === 2 && <HandCoins size={20} />}
                {index === 3 && <TrendingUp size={20} />}
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
              <AreaChart data={displayChartData}>
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
                  formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`, '']}
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
                  data={displayPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {displayPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`${value}%`, 'Persentase']} />
              </RePieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-4">
            {displayPieData.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{item.name}</span>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {item.percentage ? `${item.percentage}%` : `${item.value}%`}
                </span>
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
            {displayActivities.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <Activity size={40} className="mx-auto mb-3 opacity-50" />
                <p className="text-sm">Belum ada aktivitas terbaru</p>
              </div>
            ) : (
              displayActivities.map((activity) => {
                const IconComponent = getIconComponent(activity.icon);
                return (
                  <div key={activity.id} className="p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-neutral-700/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-imigrasi-primary/5 dark:bg-white/5 rounded-2xl flex items-center justify-center text-imigrasi-primary dark:text-white">
                        <IconComponent size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white">{activity.title}</h4>
                        <p className="text-xs text-gray-500">{activity.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(activity.amount)}</p>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${activity.status_color}`}>
                        {activity.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="space-y-6">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white">
            Pintasan {user?.role?.name === 'admin' ? 'Admin' : 'Tugas'}
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {displayQuickLinks.map((link, index) => {
              const IconComponent = getIconComponent(link.icon);
              return (
                <button 
                  key={index}
                  onClick={() => navigate(link.route)}
                  className="flex items-center gap-4 p-4 glass-card rounded-2xl hover:border-imigrasi-accent transition-all group relative"
                >
                  {link.badge && (
                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {link.badge}
                    </span>
                  )}
                  <div className={`p-3 ${link.icon_color} rounded-xl group-hover:scale-110 transition-transform`}>
                    <IconComponent size={20} />
                  </div>
                  <div className="text-left">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">{link.title}</h4>
                    <p className="text-[10px] text-gray-500">{link.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminDashboard;