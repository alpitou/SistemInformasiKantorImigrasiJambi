import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Mail, Phone, MapPin, Briefcase, Shield, Camera, Save, Lock, Smartphone, ArrowRight, X, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleUpdatePassword = async () => {
    setIsUpdatingPassword(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsUpdatingPassword(false);
    setShowPasswordModal(false);
  };

  const handleSave = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
    setIsEditing(false);
  };

  if (!user) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profil Saya</h1>
          <p className="text-gray-500 dark:text-gray-400">Kelola informasi pribadi dan keamanan akun Anda.</p>
        </div>
        {!isEditing ? (
          <button 
            onClick={() => setIsEditing(true)}
            className="px-6 py-2 bg-imigrasi-primary text-white rounded-xl text-sm font-bold hover:bg-blue-900 transition-colors shadow-lg shadow-imigrasi-primary/20"
          >
            Edit Profil
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsEditing(false)}
              className="px-6 py-2 bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-300 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors"
            >
              Batal
            </button>
            <button 
              onClick={handleSave}
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-2 bg-imigrasi-primary text-white rounded-xl text-sm font-bold hover:bg-blue-900 transition-colors shadow-lg shadow-imigrasi-primary/20 disabled:opacity-70"
            >
              {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={18} />}
              Simpan Perubahan
            </button>
          </div>
        )}
      </div>

      {/* Change Password Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowPasswordModal(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-neutral-800 rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 dark:border-neutral-700 flex items-center justify-between bg-imigrasi-primary text-white">
                <h3 className="font-bold text-xl">Ganti Password</h3>
                <button onClick={() => setShowPasswordModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Password Lama</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type={showPassword ? "text" : "password"}
                      className="w-full pl-12 pr-12 py-4 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-2xl outline-none transition-all dark:text-white"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Password Baru</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type={showPassword ? "text" : "password"}
                      className="w-full pl-12 pr-12 py-4 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-2xl outline-none transition-all dark:text-white"
                    />
                    <button 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-imigrasi-primary transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Konfirmasi Password Baru</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type={showPassword ? "text" : "password"}
                      className="w-full pl-12 pr-12 py-4 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-2xl outline-none transition-all dark:text-white"
                    />
                  </div>
                </div>
                <button 
                  onClick={handleUpdatePassword}
                  disabled={isUpdatingPassword}
                  className="w-full py-4 bg-imigrasi-primary text-white font-bold rounded-2xl hover:bg-blue-900 transition-all shadow-lg shadow-imigrasi-primary/20 disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {isUpdatingPassword && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  {isUpdatingPassword ? 'Memproses...' : 'Perbarui Password'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="space-y-8">
          <div className="glass-card p-8 rounded-[2.5rem] text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-imigrasi-primary to-blue-900" />
            <div className="relative pt-8">
              <div className="relative inline-block">
                <img 
                  src={user.avatar} 
                  alt={user.name} 
                  className="w-32 h-32 rounded-3xl border-4 border-white dark:border-neutral-800 shadow-xl object-cover mx-auto"
                />
                {isEditing && (
                  <button className="absolute bottom-[-10px] right-[-10px] p-3 bg-imigrasi-accent text-imigrasi-primary rounded-2xl shadow-lg hover:scale-110 transition-transform">
                    <Camera size={18} />
                  </button>
                )}
              </div>
              <h2 className="mt-6 text-xl font-bold text-gray-900 dark:text-white">{user.name}</h2>
              <p className="text-sm font-mono text-gray-500 mt-1">{user.nip}</p>
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                <Shield size={12} />
                Anggota Terverifikasi
              </div>
            </div>
          </div>

          <div className="glass-card p-6 rounded-3xl space-y-4">
            <h3 className="font-bold text-gray-900 dark:text-white">Keamanan Akun</h3>
            <button 
              onClick={() => setShowPasswordModal(true)}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-neutral-700/30 hover:bg-gray-100 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg group-hover:scale-110 transition-transform"><Lock size={18} /></div>
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Ganti Password</span>
              </div>
              <ArrowRight size={16} className="text-gray-400" />
            </button>
            <button className="w-full flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-neutral-700/30 hover:bg-gray-100 transition-all group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg group-hover:scale-110 transition-transform"><Smartphone size={18} /></div>
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Dua Faktor (2FA)</span>
              </div>
              <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-1 rounded-full">Nonaktif</span>
            </button>
          </div>
        </div>

        {/* Details Form */}
        <div className="lg:col-span-2 space-y-8">
          <div className="glass-card p-8 rounded-[2.5rem] space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Nama Lengkap</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="text" 
                    defaultValue={user.name}
                    disabled={!isEditing}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-2xl outline-none transition-all dark:text-white disabled:opacity-60"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">NIP</label>
                <div className="relative">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="text" 
                    defaultValue={user.nip}
                    disabled
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent rounded-2xl outline-none dark:text-white opacity-60"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Email Dinas</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="email" 
                    defaultValue={`${user.name.toLowerCase().replace(' ', '.')}@imigrasi.go.id`}
                    disabled={!isEditing}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-2xl outline-none transition-all dark:text-white disabled:opacity-60"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Nomor WhatsApp</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="tel" 
                    defaultValue="081234567890"
                    disabled={!isEditing}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-2xl outline-none transition-all dark:text-white disabled:opacity-60"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Unit Kerja</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-4 text-gray-400" size={18} />
                <textarea 
                  rows={2}
                  defaultValue={user.unitKerja}
                  disabled={!isEditing}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-2xl outline-none transition-all dark:text-white disabled:opacity-60 resize-none"
                />
              </div>
            </div>
          </div>

          <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-3xl border border-blue-100 dark:border-blue-900/30 flex items-start gap-4">
            <div className="p-2 bg-blue-500 text-white rounded-xl"><Briefcase size={20} /></div>
            <div>
              <h4 className="font-bold text-blue-900 dark:text-blue-400">Informasi Keanggotaan</h4>
              <p className="text-sm text-blue-800 dark:text-blue-500/80 mt-1 leading-relaxed">
                Anda terdaftar sebagai anggota aktif sejak Januari 2020. Pastikan data profil Anda selalu mutakhir untuk kelancaran administrasi koperasi.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Profile;