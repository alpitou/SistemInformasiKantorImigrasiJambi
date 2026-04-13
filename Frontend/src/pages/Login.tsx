import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Lock, User, Eye, EyeOff, ArrowRight, Info } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Check for admin or member
      if (username === 'admin') {
        login('admin');
        navigate('/admin');
      } else if (username === 'member') {
        login('member');
        navigate('/member');
      } else if (username === 'secretary') {
        login('secretary');
        navigate('/admin');
      } else if (username === 'treasurer') {
        login('treasurer');
        navigate('/admin');
      } else if (username === 'chairman') {
        login('chairman');
        navigate('/admin');
      } else {
        setError('Username atau password salah. Coba "admin", "member", "secretary", "treasurer", atau "chairman".');
      }
    } catch (err) {
      setError('Terjadi kesalahan sistem. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Accents */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-imigrasi-primary/5 dark:bg-imigrasi-primary/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-imigrasi-accent/5 dark:bg-imigrasi-accent/10 rounded-full blur-[120px]"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-imigrasi-primary rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-imigrasi-primary/30">
            <Shield size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-imigrasi-primary dark:text-white tracking-tight">SIMKOP-IM</h1>
          <p className="text-gray-500 dark:text-gray-400 font-bold text-sm mt-2">Koperasi Kantor Imigrasi Jambi</p>
        </div>

        {/* Login Card */}
        <div className="glass-card p-8 rounded-[2.5rem] shadow-2xl border-white/50 dark:border-neutral-800">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 ml-1 uppercase tracking-widest">Username / NIP</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-imigrasi-primary transition-colors" size={18} />
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username..." 
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-neutral-800 border-2 border-transparent focus:border-imigrasi-primary rounded-2xl outline-none transition-all dark:text-white"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Password</label>
                <button type="button" className="text-xs font-bold text-imigrasi-primary dark:text-imigrasi-accent hover:underline">Lupa Password?</button>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-imigrasi-primary transition-colors" size={18} />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password..." 
                  className="w-full pl-12 pr-12 py-4 bg-gray-50 dark:bg-neutral-800 border-2 border-transparent focus:border-imigrasi-primary rounded-2xl outline-none transition-all dark:text-white"
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-center gap-3"
              >
                <div className="p-1.5 bg-red-500 text-white rounded-lg"><Lock size={12} /></div>
                <p className="text-xs font-bold text-red-600 dark:text-red-400">{error}</p>
              </motion.div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-4 bg-imigrasi-primary text-white font-black rounded-2xl hover:bg-blue-900 transition-all shadow-xl shadow-imigrasi-primary/20 flex items-center justify-center gap-3 disabled:opacity-70"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  LOGIN
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-gray-100 dark:border-neutral-800 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">Silakan hubungi pengurus koperasi untuk pendaftaran anggota baru.</p>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 rounded-2xl flex items-start gap-3">
          <Info size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-[10px] text-amber-800 dark:text-amber-500/80 leading-relaxed">
            Gunakan username <span className="font-bold">"admin"</span>, <span className="font-bold">"secretary"</span>, <span className="font-bold">"treasurer"</span>, <span className="font-bold">"chairman"</span> untuk dashboard pengurus atau <span className="font-bold">"member"</span> untuk dashboard anggota.
          </p>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest font-bold">
            &copy; 2026 Kantor Imigrasi Kelas I TPI Jambi
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
