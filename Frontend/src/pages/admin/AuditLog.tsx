import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Activity, Search, Filter, Download, User, Clock, Shield, RefreshCw } from 'lucide-react';

const AuditLog: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const logs = [
    { id: 'LOG-001', user: 'Admin Utama', action: 'Update Suku Bunga', target: 'Financial Settings', date: '2026-04-07 10:15:22', ip: '192.168.1.1' },
    { id: 'LOG-002', user: 'Bendahara', action: 'Approve Pinjaman', target: 'Loan #LP-2025-001', date: '2026-04-07 09:45:10', ip: '192.168.1.5' },
    { id: 'LOG-003', user: 'Admin Utama', action: 'Upload Dokumen', target: 'RAT_2025.pdf', date: '2026-04-07 08:30:05', ip: '192.168.1.1' },
    { id: 'LOG-004', user: 'Sistem', action: 'Auto-Backup', target: 'Database', date: '2026-04-07 00:00:01', ip: 'localhost' },
    { id: 'LOG-005', user: 'Ketua', action: 'Login', target: 'Sistem', date: '2026-04-06 22:10:45', ip: '10.0.0.12' },
  ];

  const filteredLogs = logs.filter(log => 
    log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.target.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Audit Log</h1>
          <p className="text-gray-500 dark:text-gray-400">Pantau seluruh aktivitas administratif dan perubahan sistem.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-3 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-500 hover:text-imigrasi-primary transition-colors">
            <RefreshCw size={18} />
          </button>
          <button className="flex items-center gap-2 px-6 py-2 bg-imigrasi-primary text-white rounded-xl text-sm font-bold hover:bg-blue-900 transition-colors shadow-lg shadow-imigrasi-primary/20">
            <Download size={18} />
            Export Log
          </button>
        </div>
      </div>

      <div className="glass-card p-4 rounded-3xl flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Cari berdasarkan user, aksi, atau target..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-2xl outline-none transition-all dark:text-white"
          />
        </div>
        <button className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-50 dark:bg-neutral-700 rounded-2xl text-sm font-bold text-gray-600 dark:text-gray-300">
          <Filter size={18} />
          Filter Periode
        </button>
      </div>

      <div className="glass-card rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-neutral-800/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-bold">Waktu</th>
                <th className="px-6 py-4 font-bold">User</th>
                <th className="px-6 py-4 font-bold">Aksi</th>
                <th className="px-6 py-4 font-bold">Target</th>
                <th className="px-6 py-4 font-bold">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-700">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-neutral-700/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock size={14} />
                      {log.date}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-imigrasi-primary/10 rounded-full flex items-center justify-center text-imigrasi-primary">
                        <User size={14} />
                      </div>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{log.user}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{log.target}</td>
                  <td className="px-6 py-4 text-xs font-mono text-gray-400">{log.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

export default AuditLog;
