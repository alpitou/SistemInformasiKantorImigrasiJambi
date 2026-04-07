import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Settings as SettingsIcon, 
  Shield, 
  Bell, 
  Globe, 
  Database, 
  Lock, 
  Save, 
  RefreshCw,
  Building,
  Mail,
  Phone,
  CreditCard
} from 'lucide-react';

const Settings: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [notifSettings, setNotifSettings] = useState({
    whatsapp: true,
    email: false,
    newDoc: true
  });

  const handleSave = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  const tabs = [
    { id: 'general', label: 'Umum', icon: Building },
    { id: 'security', label: 'Keamanan', icon: Shield },
    { id: 'notifications', label: 'Notifikasi', icon: Bell },
    { id: 'financial', label: 'Keuangan', icon: CreditCard },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pengaturan Sistem</h1>
          <p className="text-gray-500 dark:text-gray-400">Konfigurasi operasional, keamanan, dan parameter keuangan koperasi.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isLoading}
          className="flex items-center gap-2 px-6 py-2 bg-imigrasi-primary text-white rounded-xl text-sm font-bold hover:bg-blue-900 transition-colors shadow-lg shadow-imigrasi-primary/20 disabled:opacity-70"
        >
          {isLoading ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
          Simpan Perubahan
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Tabs */}
        <div className="glass-card p-4 rounded-3xl h-fit space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-3 p-4 rounded-2xl transition-all font-bold text-sm",
                activeTab === tab.id 
                ? "bg-imigrasi-primary text-white shadow-lg" 
                : "text-gray-500 hover:bg-gray-50 dark:hover:bg-neutral-700/30"
              )}
            >
              <tab.icon size={20} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-8">
          {activeTab === 'general' && (
            <div className="glass-card p-8 rounded-[2.5rem] space-y-8">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Informasi Koperasi</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Nama Koperasi</label>
                  <input type="text" defaultValue="Koperasi Kanim Jambi" className="w-full p-4 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-2xl outline-none transition-all dark:text-white" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Email Resmi</label>
                  <input type="email" defaultValue="koperasi@kanimjambi.go.id" className="w-full p-4 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-2xl outline-none transition-all dark:text-white" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Nomor Telepon</label>
                  <input type="tel" defaultValue="+62 741 123456" className="w-full p-4 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-2xl outline-none transition-all dark:text-white" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Website</label>
                  <input type="url" defaultValue="https://kanimjambi.imigrasi.go.id" className="w-full p-4 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-2xl outline-none transition-all dark:text-white" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Alamat Kantor</label>
                <textarea rows={3} defaultValue="Jl. Jend. Sudirman No. 123, Kota Jambi, Jambi" className="w-full p-4 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-2xl outline-none transition-all dark:text-white resize-none" />
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="glass-card p-8 rounded-[2.5rem] space-y-8">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Keamanan & Akses</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-6 bg-gray-50 dark:bg-neutral-700/30 rounded-3xl">
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">Otentikasi Dua Faktor (2FA)</h4>
                    <p className="text-xs text-gray-500 mt-1">Wajibkan admin menggunakan 2FA untuk login.</p>
                  </div>
                  <div className="w-12 h-6 bg-imigrasi-primary rounded-full relative cursor-pointer">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-6 bg-gray-50 dark:bg-neutral-700/30 rounded-3xl">
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">Pendaftaran Mandiri</h4>
                    <p className="text-xs text-gray-500 mt-1">Izinkan anggota mendaftar sendiri melalui halaman login.</p>
                  </div>
                  <div className="w-12 h-6 bg-gray-300 dark:bg-neutral-600 rounded-full relative cursor-pointer">
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-6 bg-gray-50 dark:bg-neutral-700/30 rounded-3xl">
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">Sesi Login</h4>
                    <p className="text-xs text-gray-500 mt-1">Durasi sesi aktif sebelum logout otomatis (menit).</p>
                  </div>
                  <input type="number" defaultValue={60} className="w-20 p-2 bg-white dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 rounded-lg text-center font-bold" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="glass-card p-8 rounded-[2.5rem] space-y-8">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Pengaturan Notifikasi</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-6 bg-gray-50 dark:bg-neutral-700/30 rounded-3xl">
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">Notifikasi WhatsApp</h4>
                    <p className="text-xs text-gray-500 mt-1">Kirim pemberitahuan transaksi melalui WhatsApp.</p>
                  </div>
                  <button 
                    onClick={() => setNotifSettings(prev => ({ ...prev, whatsapp: !prev.whatsapp }))}
                    className={cn(
                      "w-12 h-6 rounded-full relative transition-colors",
                      notifSettings.whatsapp ? "bg-emerald-500" : "bg-gray-300 dark:bg-neutral-600"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                      notifSettings.whatsapp ? "right-1" : "left-1"
                    )} />
                  </button>
                </div>
                <div className="flex items-center justify-between p-6 bg-gray-50 dark:bg-neutral-700/30 rounded-3xl">
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">Notifikasi Email</h4>
                    <p className="text-xs text-gray-500 mt-1">Kirim laporan bulanan melalui email.</p>
                  </div>
                  <button 
                    onClick={() => setNotifSettings(prev => ({ ...prev, email: !prev.email }))}
                    className={cn(
                      "w-12 h-6 rounded-full relative transition-colors",
                      notifSettings.email ? "bg-imigrasi-primary" : "bg-gray-300 dark:bg-neutral-600"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                      notifSettings.email ? "right-1" : "left-1"
                    )} />
                  </button>
                </div>
                <div className="flex items-center justify-between p-6 bg-gray-50 dark:bg-neutral-700/30 rounded-3xl">
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">Notifikasi Dokumen Baru</h4>
                    <p className="text-xs text-gray-500 mt-1">Beritahu anggota saat ada dokumen baru diunggah.</p>
                  </div>
                  <button 
                    onClick={() => setNotifSettings(prev => ({ ...prev, newDoc: !prev.newDoc }))}
                    className={cn(
                      "w-12 h-6 rounded-full relative transition-colors",
                      notifSettings.newDoc ? "bg-imigrasi-primary" : "bg-gray-300 dark:bg-neutral-600"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                      notifSettings.newDoc ? "right-1" : "left-1"
                    )} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'financial' && (
            <div className="glass-card p-8 rounded-[2.5rem] space-y-8">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Parameter Keuangan</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Simpanan Pokok (IDR)</label>
                  <input type="number" defaultValue={100000} className="w-full p-4 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-2xl outline-none transition-all dark:text-white" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Simpanan Wajib / Bulan (IDR)</label>
                  <input type="number" defaultValue={50000} className="w-full p-4 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-2xl outline-none transition-all dark:text-white" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Maksimal Tenor (Bulan)</label>
                  <input type="number" defaultValue={24} className="w-full p-4 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-2xl outline-none transition-all dark:text-white" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const cn = (...inputs: any[]) => inputs.filter(Boolean).join(' ');

export default Settings;
