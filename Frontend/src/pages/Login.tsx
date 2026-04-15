import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Shield, Lock, Mail, Eye, EyeOff, ArrowRight, AlertCircle, Server, CheckCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('admin@koperasi.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'connected' | 'failed' | null>(null);
  const { login, isLoading, error: authError, testBackendConnection } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Test backend connection on mount
    const testConnection = async () => {
      setConnectionStatus('testing');
      const isConnected = await testBackendConnection();
      setConnectionStatus(isConnected ? 'connected' : 'failed');
      if (!isConnected) {
        setLocalError('Tidak dapat terhubung ke server backend. Pastikan server Laravel berjalan di http://localhost:8000');
      }
    };
    testConnection();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    
    console.log('Form submitted with:', { email, passwordLength: password.length });
    
    if (!email || !password) {
      setLocalError('Email dan password harus diisi');
      return;
    }

    try {
      await login(email, password);
      console.log('Login successful, navigating...');
      
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      console.log('User after login:', user);
      
      if (user?.role?.name === 'admin' || user?.role?.name === 'ketua' || 
          user?.role?.name === 'bendahara' || user?.role?.name === 'pengawas') {
        navigate('/admin');
      } else {
        navigate('/member');
      }
    } catch (err: any) {
      console.error('Login submission error:', err);
      setLocalError(err.response?.data?.message || authError || 'Login gagal. Silakan cek email dan password Anda.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/5 dark:bg-blue-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-400/5 dark:bg-blue-400/10 rounded-full blur-[120px]"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-600/30">
            <Shield size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-blue-600 dark:text-white tracking-tight">SIMKOP-IM</h1>
          <p className="text-gray-500 dark:text-gray-400 font-bold text-sm mt-2">Koperasi Kantor Imigrasi Jambi</p>
        </div>

        {/* Connection Status */}
        {connectionStatus === 'testing' && (
          <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-medium text-yellow-700 dark:text-yellow-400">Mengecek koneksi ke server...</p>
          </div>
        )}
        
        {connectionStatus === 'connected' && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl flex items-center gap-3">
            <CheckCircle size={16} className="text-green-600" />
            <p className="text-xs font-medium text-green-700 dark:text-green-400">Terhubung ke server backend</p>
          </div>
        )}
        
        {connectionStatus === 'failed' && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl flex items-center gap-3">
            <Server size={16} className="text-red-600" />
            <p className="text-xs font-medium text-red-700 dark:text-red-400">Gagal terhubung ke server. Pastikan Laravel running di port 8000</p>
          </div>
        )}

        <div className="bg-white dark:bg-neutral-800 p-8 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-neutral-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 ml-1 uppercase tracking-widest">Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Masukkan email..." 
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-blue-600 rounded-2xl outline-none transition-all dark:text-white"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 ml-1 uppercase tracking-widest">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password..." 
                  className="w-full pl-12 pr-12 py-4 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-blue-600 rounded-2xl outline-none transition-all dark:text-white"
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

            {(localError || authError) && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl flex items-start gap-3"
              >
                <AlertCircle size={18} className="text-red-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-red-700 dark:text-red-400">{localError || authError}</p>
                  <p className="text-[10px] text-red-600 dark:text-red-500 mt-1 font-mono">Cek console browser (F12) untuk detail error</p>
                </div>
              </motion.div>
            )}

            <button 
              type="submit" 
              disabled={isLoading || connectionStatus !== 'connected'}
              className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>MEMPROSES...</span>
                </>
              ) : (
                <>
                  LOGIN
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-gray-100 dark:border-neutral-700 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Demo Login:</p>
            <p className="text-[11px] font-mono text-gray-600 dark:text-gray-400">Email: admin@koperasi.com</p>
            <p className="text-[11px] font-mono text-gray-600 dark:text-gray-400">Password: password123</p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest font-bold">
            &copy; 2026 Kantor Imigrasi Kelas I TPI Jambi
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;