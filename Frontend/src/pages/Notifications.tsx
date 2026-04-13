import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  CheckCircle2, 
  Clock, 
  Info, 
  AlertCircle, 
  Trash2, 
  Search,
  Filter,
  RefreshCw,
  MoreVertical,
  ArrowRight
} from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

const Notifications: React.FC = () => {
  const { notifications, markAsRead, markAllAsRead, clearNotifications } = useNotifications();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const navigate = useNavigate();

  const filteredNotifications = notifications.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         n.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || !n.read;
    return matchesSearch && matchesFilter;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="text-emerald-500" size={20} />;
      case 'warning': return <AlertCircle className="text-amber-500" size={20} />;
      case 'error': return <AlertCircle className="text-red-500" size={20} />;
      default: return <Info className="text-blue-500" size={20} />;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Semua Notifikasi</h1>
          <p className="text-gray-500 dark:text-gray-400">Pantau semua aktivitas dan pemberitahuan sistem Anda.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={markAllAsRead}
            className="px-4 py-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-imigrasi-primary transition-colors"
          >
            Tandai Semua Dibaca
          </button>
          <button 
            onClick={clearNotifications}
            className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors"
          >
            Hapus Semua
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 rounded-3xl flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Cari notifikasi..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-2xl outline-none transition-all dark:text-white"
          />
        </div>
        <div className="flex bg-gray-100 dark:bg-neutral-800 p-1 rounded-xl">
          <button 
            onClick={() => setFilter('all')}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-bold transition-all",
              filter === 'all' ? "bg-white dark:bg-neutral-700 shadow-sm text-imigrasi-primary dark:text-white" : "text-gray-500"
            )}
          >
            Semua
          </button>
          <button 
            onClick={() => setFilter('unread')}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-bold transition-all",
              filter === 'unread' ? "bg-white dark:bg-neutral-700 shadow-sm text-imigrasi-primary dark:text-white" : "text-gray-500"
            )}
          >
            Belum Dibaca
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredNotifications.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card p-12 rounded-[2.5rem] text-center"
            >
              <div className="w-16 h-16 bg-gray-100 dark:bg-neutral-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Bell className="text-gray-400" size={32} />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white">Tidak ada notifikasi</h3>
              <p className="text-sm text-gray-500 mt-1">Semua pemberitahuan Anda akan muncul di sini.</p>
            </motion.div>
          ) : (
            filteredNotifications.map((n) => (
              <motion.div 
                key={n.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={cn(
                  "glass-card p-6 rounded-3xl transition-all group relative overflow-hidden",
                  !n.read && "border-l-4 border-l-imigrasi-primary bg-blue-50/30 dark:bg-blue-900/5"
                )}
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white dark:bg-neutral-800 rounded-2xl shadow-sm">
                    {getTypeIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className={cn("text-sm font-bold truncate", n.read ? "text-gray-700 dark:text-gray-300" : "text-gray-900 dark:text-white")}>
                        {n.title}
                      </h4>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                          <Clock size={12} />
                          {n.time}
                        </span>
                        {!n.read && (
                          <button 
                            onClick={() => markAsRead(n.id)}
                            className="text-[10px] font-bold text-imigrasi-primary hover:underline"
                          >
                            Tandai Dibaca
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-4">{n.message}</p>
                    
                    {n.link && (
                      <button 
                        onClick={() => navigate(n.link!)}
                        className="flex items-center gap-2 text-[10px] font-bold text-imigrasi-primary dark:text-imigrasi-accent uppercase tracking-widest hover:gap-3 transition-all"
                      >
                        Lihat Detail
                        <ArrowRight size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default Notifications;
