import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import { 
  LayoutDashboard, 
  User as UserIcon, 
  Wallet, 
  HandCoins, 
  History, 
  FileText, 
  LogOut, 
  Menu, 
  X, 
  Bell, 
  Moon, 
  Sun,
  ShieldCheck,
  Users,
  PieChart,
  Settings,
  Archive,
  FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';

const Layout: React.FC = () => {
  const { user, logout, isDarkMode, toggleDarkMode, login } = useAuth();
  const { notifications, markAsRead, markAllAsRead, unreadCount, addNotification } = useNotifications();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Simulate new application notification for admin
  React.useEffect(() => {
    if (isAdminRole(user?.role)) {
      const timer = setTimeout(() => {
        const hasNotified = sessionStorage.getItem('admin_notified_pengajuan');
        if (!hasNotified) {
          addNotification({
            title: 'Pengajuan Baru',
            message: 'Ada 3 pengajuan pinjaman baru yang memerlukan persetujuan Anda.',
            type: 'info',
            link: '/admin/approvals'
          });
          sessionStorage.setItem('admin_notified_pengajuan', 'true');
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [user, addNotification]);

  const memberNavItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/member', end: true },
    { icon: Wallet, label: 'Simpanan', path: '/member/savings' },
    { icon: HandCoins, label: 'Pinjaman', path: '/member/loans' },
    { icon: PieChart, label: 'SHU', path: '/member/shu' },
    { icon: History, label: 'Riwayat', path: '/member/history' },
    { icon: FileText, label: 'Dokumen', path: '/member/documents' },
  ];

  const adminNavItems = [
    { 
      icon: LayoutDashboard, 
      label: user?.role === 'secretary' ? 'Dashboard Sekretaris' : 
             user?.role === 'treasurer' ? 'Dashboard Bendahara' : 
             user?.role === 'chairman' ? 'Dashboard Ketua' : 'Executive Dashboard', 
      path: '/admin', 
      end: true 
    },
    ...(user?.role === 'secretary' || user?.role === 'chairman' || user?.role === 'admin' ? [
      { icon: Users, label: 'Manajemen Anggota', path: '/admin/members' }
    ] : []),
    ...(user?.role === 'treasurer' || user?.role === 'chairman' || user?.role === 'admin' ? [
      { icon: Wallet, label: 'Keuangan', path: '/admin/finance' }
    ] : []),
    ...(user?.role === 'treasurer' || user?.role === 'chairman' || user?.role === 'admin' ? [
      { icon: ShieldCheck, label: 'Persetujuan', path: '/admin/approvals' }
    ] : []),
    ...(user?.role === 'secretary' || user?.role === 'chairman' || user?.role === 'admin' ? [
      { icon: Archive, label: 'Arsip Perjanjian', path: '/admin/archives' }
    ] : []),
    ...(user?.role === 'treasurer' || user?.role === 'chairman' || user?.role === 'admin' ? [
      { icon: FileSpreadsheet, label: 'Ekspor Potongan', path: '/admin/deductions' }
    ] : []),
    ...(user?.role === 'secretary' || user?.role === 'chairman' || user?.role === 'admin' ? [
      { icon: FileText, label: 'Upload Dokumen', path: '/admin/documents' }
    ] : []),
    ...(user?.role === 'treasurer' || user?.role === 'chairman' || user?.role === 'admin' ? [
      { icon: FileText, label: 'Laporan Keuangan', path: '/admin/reports' }
    ] : []),
    { icon: Settings, label: 'Pengaturan', path: '/admin/settings' },
  ];

  const isAdminRole = (role?: string) => ['admin', 'secretary', 'treasurer', 'chairman'].includes(role || '');
  const navItems = isAdminRole(user?.role) ? adminNavItems : memberNavItems;

  return (
    <div className="min-h-screen flex bg-imigrasi-neutral-light dark:bg-neutral-900">
      {/* Sidebar Desktop */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className={cn(
          "hidden md:flex flex-col sticky top-0 h-screen z-30 shadow-2xl transition-colors duration-300",
          isDarkMode ? "bg-neutral-950 border-r border-neutral-800" : "bg-imigrasi-primary text-white"
        )}
      >
        <div className="p-6 flex items-center justify-between overflow-hidden">
          <AnimatePresence mode="wait">
            {isSidebarOpen && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-3 whitespace-nowrap"
              >
                <div className="w-10 h-10 bg-imigrasi-accent rounded-lg flex items-center justify-center font-bold text-imigrasi-primary shadow-lg">
                  SIM
                </div>
                <div className={cn(isDarkMode ? "text-white" : "text-white")}>
                  <h1 className="font-bold text-lg leading-tight">SIMKOP-IM</h1>
                  <p className="text-[10px] text-imigrasi-accent uppercase tracking-widest font-semibold">Kanim Jambi</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={cn(
              "p-2 rounded-lg transition-colors",
              isDarkMode ? "hover:bg-neutral-800 text-neutral-400" : "hover:bg-white/10 text-white"
            )}
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) => cn(
                "w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-200 group",
                isActive 
                ? (isDarkMode ? "bg-imigrasi-accent/10 text-imigrasi-accent shadow-[0_0_20px_rgba(212,175,55,0.1)]" : "bg-imigrasi-accent text-imigrasi-primary shadow-lg") 
                : (isDarkMode ? "text-neutral-500 hover:text-neutral-200 hover:bg-neutral-900" : "text-white/70 hover:text-white hover:bg-white/10")
              )}
            >
              <item.icon size={22} className="shrink-0" />
              {isSidebarOpen && <span className="font-medium">{item.label}</span>}
            </NavLink>
          ))}
        </nav>
      </motion.aside>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar Mobile */}
      <motion.aside
        initial={{ x: '-100%' }}
        animate={{ x: isMobileMenuOpen ? 0 : '-100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={cn(
          "fixed top-0 left-0 bottom-0 w-72 z-50 md:hidden flex flex-col",
          isDarkMode ? "bg-neutral-950 border-r border-neutral-800" : "bg-imigrasi-primary text-white"
        )}
      >
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-imigrasi-accent rounded-lg flex items-center justify-center font-bold text-imigrasi-primary">
              SIM
            </div>
            <div>
              <h1 className="font-bold text-lg">SIMKOP-IM</h1>
              <p className="text-[10px] text-imigrasi-accent">Kanim Jambi</p>
            </div>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)}>
            <X size={24} />
          </button>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) => cn(
                "w-full flex items-center gap-4 p-4 rounded-xl transition-all",
                isActive 
                ? (isDarkMode ? "bg-imigrasi-accent/10 text-imigrasi-accent" : "bg-imigrasi-accent text-imigrasi-primary shadow-lg") 
                : (isDarkMode ? "text-neutral-500 hover:text-neutral-200" : "text-white/70 hover:text-white")
              )}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <item.icon size={22} />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Navbar */}
        <header className="h-20 bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700 flex items-center justify-between px-4 md:px-8 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 text-gray-600 dark:text-gray-300"
            >
              <Menu size={24} />
            </button>
            <div className="hidden md:block">
              <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Selamat Datang,</h2>
              <p className="text-lg font-bold text-imigrasi-primary dark:text-white">{user?.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <button 
              onClick={toggleDarkMode}
              className="p-2.5 rounded-full bg-gray-100 dark:bg-neutral-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-600 transition-colors"
              title={isDarkMode ? 'Mode Terang' : 'Mode Gelap'}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="relative">
              <button 
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="p-2.5 rounded-full bg-gray-100 dark:bg-neutral-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-600 transition-colors relative"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-neutral-800"></span>
                )}
              </button>

              <AnimatePresence>
                {isNotificationOpen && (
                  <>
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-40"
                      onClick={() => setIsNotificationOpen(false)}
                    />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-80 bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-neutral-700 z-50 overflow-hidden"
                    >
                      <div className="p-4 border-b border-gray-100 dark:border-neutral-700 flex items-center justify-between">
                        <h4 className="font-bold text-gray-900 dark:text-white">Notifikasi</h4>
                        <button 
                          onClick={markAllAsRead}
                          className="text-[10px] font-bold text-imigrasi-primary dark:text-imigrasi-accent uppercase tracking-widest"
                        >
                          Tandai Semua Dibaca
                        </button>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center">
                            <p className="text-sm text-gray-500">Tidak ada notifikasi</p>
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div 
                              key={n.id} 
                              onClick={() => {
                                markAsRead(n.id);
                                if (n.link) {
                                  navigate(n.link);
                                  setIsNotificationOpen(false);
                                }
                              }}
                              className={cn(
                                "p-4 border-b border-gray-50 dark:border-neutral-700/50 hover:bg-gray-50 dark:hover:bg-neutral-700/30 transition-colors cursor-pointer", 
                                !n.read && "bg-blue-50/50 dark:bg-blue-900/10"
                              )}
                            >
                              <div className="flex justify-between items-start mb-1">
                                <h5 className="text-sm font-bold text-gray-900 dark:text-white">{n.title}</h5>
                                <span className="text-[10px] text-gray-400">{n.time}</span>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{n.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                      <button 
                        onClick={() => {
                          setIsNotificationOpen(false);
                          navigate(isAdminRole(user?.role) ? '/admin/notifications' : '/member/notifications');
                        }}
                        className="w-full p-3 text-xs font-bold text-gray-500 hover:text-imigrasi-primary dark:hover:text-imigrasi-accent transition-colors border-t border-gray-100 dark:border-neutral-700"
                      >
                        Lihat Semua Notifikasi
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-neutral-700 relative">
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-neutral-700/50 p-1 rounded-xl transition-colors"
              >
                <img 
                  src={user?.avatar} 
                  alt={user?.name} 
                  className="w-10 h-10 rounded-full border-2 border-imigrasi-accent shadow-sm"
                />
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-bold text-gray-900 dark:text-white leading-none">{user?.name}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 font-mono">{user?.nip}</p>
                </div>
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <>
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-40"
                      onClick={() => setIsProfileOpen(false)}
                    />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-neutral-700 z-50 overflow-hidden"
                    >
                      <div className="p-4 border-b border-gray-100 dark:border-neutral-700 bg-gray-50/50 dark:bg-neutral-700/30">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Akun Saya</p>
                      </div>
                      <div className="p-2 space-y-1">
                        {user?.role === 'member' && (
                          <button 
                            onClick={() => {
                              navigate('/member/profile');
                              setIsProfileOpen(false);
                            }}
                            className="w-full flex items-center gap-3 p-3 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
                          >
                            <UserIcon size={18} />
                            Profil Saya
                          </button>
                        )}
                        <div className="h-px bg-gray-100 dark:bg-neutral-700 my-1" />
                        <button 
                          onClick={logout}
                          className="w-full flex items-center gap-3 p-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                        >
                          <LogOut size={18} />
                          Logout
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
