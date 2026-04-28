// src/pages/admin/Settings.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  CreditCard,
  Wallet,
  TrendingUp,
  Percent,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Edit2,
  X,
  Plus,
  Trash2,
  Calculator
} from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import api from '../../services/api';
import { cn } from '../../lib/utils';

interface SavingType {
  id: number;
  name: string;
  default_amount: number;
}

interface LoanSetting {
  max_tenor_months: number;
  default_interest_rate: number;
  min_loan_amount: number;
  max_loan_amount: number;
}

const Settings: React.FC = () => {
  const { addNotification } = useNotifications();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  
  // Saving Types State
  const [savingTypes, setSavingTypes] = useState<SavingType[]>([]);
  const [editingSavingType, setEditingSavingType] = useState<SavingType | null>(null);
  const [showSavingTypeModal, setShowSavingTypeModal] = useState(false);
  const [newSavingTypeName, setNewSavingTypeName] = useState('');
  const [newSavingTypeAmount, setNewSavingTypeAmount] = useState('');
  
  // Loan Settings State
  const [loanSettings, setLoanSettings] = useState<LoanSetting>({
    max_tenor_months: 10,
    default_interest_rate: 1,
    min_loan_amount: 100000,
    max_loan_amount: 50000000
  });
  
  // General Info State
  const [generalInfo, setGeneralInfo] = useState({
    cooperative_name: 'Koperasi Kanim Jambi',
    email: 'koperasi@kanimjambi.go.id',
    phone: '+62 741 123456',
    website: 'https://kanimjambi.imigrasi.go.id',
    address: 'Jl. Jend. Sudirman No. 123, Kota Jambi, Jambi'
  });

  const [loanSimulation, setLoanSimulation] = useState({
    amount: 10000000,
    tenor: 10,
    monthlyInstallment: 0,
    totalPayment: 0,
    totalInterest: 0
  });

  // Fetch saving types from API
  const fetchSavingTypes = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/saving-types');
      if (response.data.success) {
        setSavingTypes(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch saving types:', error);
      addNotification({
        title: 'Gagal Memuat Data',
        message: 'Tidak dapat memuat data jenis simpanan',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  }, [addNotification]);

  // Fetch loan settings from API
  const fetchLoanSettings = useCallback(async () => {
    try {
      const response = await api.get('/settings/loan');
      if (response.data.success) {
        setLoanSettings(response.data.data);
        setLoanSimulation(prev => ({ ...prev, tenor: response.data.data.max_tenor_months }));
      }
    } catch (error) {
      console.error('Failed to fetch loan settings:', error);
    }
  }, []);

  useEffect(() => {
    fetchSavingTypes();
    fetchLoanSettings();
  }, [fetchSavingTypes, fetchLoanSettings]);

  const updateLoanSimulation = useCallback((settings: LoanSetting, amount?: number) => {
    const loanAmount = amount !== undefined ? amount : loanSimulation.amount;
    const tenor = settings.max_tenor_months;
    const interest = settings.default_interest_rate;
    
    const totalInterestAmount = loanAmount * interest / 100;
    const totalPayment = loanAmount + totalInterestAmount;
    const monthlyInstallment = Math.ceil(totalPayment / tenor);
    
    setLoanSimulation({
      amount: loanAmount,
      tenor: tenor,
      monthlyInstallment: monthlyInstallment,
      totalPayment: totalPayment,
      totalInterest: totalInterestAmount
    });
  }, [loanSimulation.amount]);

  const handleLoanAmountChange = (amount: number) => {
    const totalInterestAmount = amount * loanSettings.default_interest_rate / 100;
    const totalPayment = amount + totalInterestAmount;
    const monthlyInstallment = Math.ceil(totalPayment / loanSettings.max_tenor_months);
    setLoanSimulation({
      amount: amount,
      tenor: loanSettings.max_tenor_months,
      monthlyInstallment: monthlyInstallment,
      totalPayment: totalPayment,
      totalInterest: totalInterestAmount
    });
  };

  const handleUpdateSavingType = async (id: number, name: string, default_amount: number) => {
    setIsLoading(true);
    try {
      const response = await api.put(`/saving-types/${id}`, {
        name: name,
        default_amount: default_amount
      });
      
      if (response.data.success) {
        addNotification({
          title: 'Berhasil',
          message: `Simpanan ${name} berhasil diupdate`,
          type: 'success'
        });
        await fetchSavingTypes();
      }
    } catch (error: any) {
      addNotification({
        title: 'Gagal',
        message: error.response?.data?.message || 'Gagal mengupdate jenis simpanan',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSavingType = async () => {
    if (!newSavingTypeName.trim()) {
      addNotification({
        title: 'Validasi Gagal',
        message: 'Nama simpanan harus diisi',
        type: 'error'
      });
      return;
    }

    if (!newSavingTypeAmount || Number(newSavingTypeAmount) < 0) {
      addNotification({
        title: 'Validasi Gagal',
        message: 'Jumlah nominal harus valid',
        type: 'error'
      });
      return;
    }

    setIsLoading(true);
    try {
      let response;
      if (editingSavingType) {
        // Update existing
        response = await api.put(`/saving-types/${editingSavingType.id}`, {
          name: newSavingTypeName,
          default_amount: Number(newSavingTypeAmount)
        });
      } else {
        // Create new
        response = await api.post('/saving-types', {
          name: newSavingTypeName,
          default_amount: Number(newSavingTypeAmount)
        });
      }
      
      if (response.data.success) {
        addNotification({
          title: 'Berhasil',
          message: editingSavingType ? 'Jenis simpanan berhasil diupdate' : 'Jenis simpanan baru berhasil ditambahkan',
          type: 'success'
        });
        await fetchSavingTypes();
        resetSavingTypeModal();
      }
    } catch (error: any) {
      addNotification({
        title: 'Gagal',
        message: error.response?.data?.message || 'Gagal menyimpan jenis simpanan',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSavingType = async (id: number, name: string) => {
    // Prevent deletion of default saving types
    if (name === 'Pokok' || name === 'Wajib' || name === 'Sukarela') {
      addNotification({
        title: 'Tidak Dapat Dihapus',
        message: `Simpanan ${name} adalah simpanan default dan tidak dapat dihapus`,
        type: 'error'
      });
      return;
    }

    if (!window.confirm(`Apakah Anda yakin ingin menghapus simpanan "${name}"?`)) return;

    setIsLoading(true);
    try {
      const response = await api.delete(`/saving-types/${id}`);
      if (response.data.success) {
        addNotification({
          title: 'Berhasil',
          message: `Simpanan ${name} berhasil dihapus`,
          type: 'success'
        });
        await fetchSavingTypes();
      }
    } catch (error: any) {
      addNotification({
        title: 'Gagal',
        message: error.response?.data?.message || 'Gagal menghapus jenis simpanan',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const editSavingType = (type: SavingType) => {
    setEditingSavingType(type);
    setNewSavingTypeName(type.name);
    setNewSavingTypeAmount(type.default_amount.toString());
    setShowSavingTypeModal(true);
  };

  const resetSavingTypeModal = () => {
    setEditingSavingType(null);
    setNewSavingTypeName('');
    setNewSavingTypeAmount('');
    setShowSavingTypeModal(false);
  };

  const handleSaveLoanSettings = async () => {
    setIsLoading(true);
    try {
      const response = await api.post('/settings/loan', loanSettings);
      if (response.data.success) {
        addNotification({
          title: 'Berhasil',
          message: 'Pengaturan pinjaman berhasil disimpan',
          type: 'success'
        });
        updateLoanSimulation(loanSettings);
      }
    } catch (error: any) {
      addNotification({
        title: 'Gagal',
        message: error.response?.data?.message || 'Gagal menyimpan pengaturan pinjaman',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveGeneralInfo = async () => {
    setIsLoading(true);
    try {
      // Save to localStorage for now (can be extended to API later)
      localStorage.setItem('cooperative_settings', JSON.stringify(generalInfo));
      addNotification({
        title: 'Berhasil',
        message: 'Informasi umum berhasil disimpan',
        type: 'success'
      });
    } catch (error: any) {
      addNotification({
        title: 'Gagal',
        message: error.message || 'Gagal menyimpan informasi umum',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'Umum', icon: Building },
    { id: 'savings', label: 'Jenis Simpanan', icon: Wallet },
    { id: 'loan', label: 'Pinjaman & Bunga', icon: Percent },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pengaturan Sistem</h1>
          <p className="text-gray-500 dark:text-gray-400">Konfigurasi operasional, keamanan, dan parameter keuangan koperasi.</p>
        </div>
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
          {/* General Settings Tab */}
          {activeTab === 'general' && (
            <div className="glass-card p-8 rounded-[2.5rem] space-y-8">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Informasi Koperasi</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Nama Koperasi</label>
                  <input 
                    type="text" 
                    value={generalInfo.cooperative_name}
                    onChange={(e) => setGeneralInfo({...generalInfo, cooperative_name: e.target.value})}
                    className="w-full p-4 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-2xl outline-none transition-all dark:text-white" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Email Resmi</label>
                  <input 
                    type="email" 
                    value={generalInfo.email}
                    onChange={(e) => setGeneralInfo({...generalInfo, email: e.target.value})}
                    className="w-full p-4 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-2xl outline-none transition-all dark:text-white" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Nomor Telepon</label>
                  <input 
                    type="tel" 
                    value={generalInfo.phone}
                    onChange={(e) => setGeneralInfo({...generalInfo, phone: e.target.value})}
                    className="w-full p-4 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-2xl outline-none transition-all dark:text-white" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Website</label>
                  <input 
                    type="url" 
                    value={generalInfo.website}
                    onChange={(e) => setGeneralInfo({...generalInfo, website: e.target.value})}
                    className="w-full p-4 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-2xl outline-none transition-all dark:text-white" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Alamat Kantor</label>
                <textarea 
                  rows={3} 
                  value={generalInfo.address}
                  onChange={(e) => setGeneralInfo({...generalInfo, address: e.target.value})}
                  className="w-full p-4 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-2xl outline-none transition-all dark:text-white resize-none" 
                />
              </div>
              <div className="flex justify-end">
                <button 
                  onClick={handleSaveGeneralInfo}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-6 py-3 bg-imigrasi-primary text-white rounded-xl text-sm font-bold hover:bg-blue-900 transition-colors"
                >
                  {isLoading ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                  Simpan Perubahan
                </button>
              </div>
            </div>
          )}

          {/* Saving Types Settings Tab */}
          {activeTab === 'savings' && (
            <div className="space-y-6">
              <div className="glass-card p-8 rounded-[2.5rem] space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Jenis Simpanan</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Kelola jenis simpanan dan nominal default untuk anggota
                    </p>
                  </div>
                  <button
                    onClick={() => setShowSavingTypeModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors"
                  >
                    <Plus size={16} />
                    Tambah Jenis
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-neutral-800/50 rounded-xl">
                      <tr>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Nama Simpanan</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Nominal Default</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Keterangan</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-neutral-700">
                      {savingTypes.map((type) => (
                        <tr key={type.id} className="hover:bg-gray-50 dark:hover:bg-neutral-700/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Wallet size={16} className="text-imigrasi-primary" />
                              <span className="font-medium text-gray-900 dark:text-white">{type.name}</span>
                              {(type.name === 'Pokok' || type.name === 'Wajib' || type.name === 'Sukarela') && (
                                <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                  Default
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(type.default_amount)}
                              </span>
                              <button
                                onClick={() => editSavingType(type)}
                                className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit nominal"
                              >
                                <Edit2 size={14} />
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {type.name === 'Pokok' && 'Simpanan awal anggota, dibayar sekali saat bergabung'}
                            {type.name === 'Wajib' && 'Simpanan bulanan yang dipotong dari gaji'}
                            {type.name === 'Sukarela' && 'Simpanan tambahan, dapat ditarik sewaktu-waktu'}
                            {!['Pokok', 'Wajib', 'Sukarela'].includes(type.name) && 'Jenis simpanan kustom'}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => editSavingType(type)}
                                className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteSavingType(type.id, type.name)}
                                className={cn(
                                  "p-1.5 rounded-lg transition-colors",
                                  (type.name === 'Pokok' || type.name === 'Wajib' || type.name === 'Sukarela')
                                    ? "text-gray-300 cursor-not-allowed"
                                    : "text-red-500 hover:text-red-700 hover:bg-red-50"
                                )}
                                disabled={type.name === 'Pokok' || type.name === 'Wajib' || type.name === 'Sukarela'}
                                title={type.name === 'Pokok' || type.name === 'Wajib' || type.name === 'Sukarela' ? 'Tidak dapat dihapus' : 'Hapus'}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl flex gap-3">
                  <AlertCircle size={20} className="text-yellow-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-yellow-700 dark:text-yellow-400">
                    <p className="font-bold mb-1">Informasi:</p>
                    <p>• Simpanan Pokok: Dibayar 1 kali saat menjadi anggota. Anggota lama yang sudah membayar tidak perlu membayar lagi.</p>
                    <p>• Simpanan Wajib: Dipotong otomatis dari gaji setiap bulan.</p>
                    <p>• Simpanan Sukarela: Setoran sukarela anggota, dapat ditarik kapan saja.</p>
                    <p>• Klik icon <Edit2 size={12} className="inline" /> untuk mengubah nominal default simpanan.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Loan Settings Tab */}
          {activeTab === 'loan' && (
            <div className="glass-card p-8 rounded-[2.5rem] space-y-8">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Pengaturan Pinjaman</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Konfigurasi parameter pinjaman yang akan berlaku untuk semua anggota
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Calendar size={12} /> Maksimal Tenor (Bulan)
                  </label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={loanSettings.max_tenor_months}
                      onChange={(e) => {
                        const newTenor = Math.min(parseInt(e.target.value) || 10, 10);
                        setLoanSettings({...loanSettings, max_tenor_months: newTenor});
                        updateLoanSimulation({...loanSettings, max_tenor_months: newTenor});
                      }}
                      min="1"
                      max="10"
                      className="w-full p-4 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-2xl outline-none transition-all dark:text-white"
                    />
                    <p className="text-xs text-gray-400 mt-1">Maksimal 10 bulan sesuai kebijakan koperasi</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Percent size={12} /> Suku Bunga (% per bulan)
                  </label>
                  <div className="relative">
                    <input 
                      type="number" 
                      step="0.5"
                      value={loanSettings.default_interest_rate}
                      onChange={(e) => {
                        const newRate = parseFloat(e.target.value) || 1;
                        setLoanSettings({...loanSettings, default_interest_rate: newRate});
                        updateLoanSimulation({...loanSettings, default_interest_rate: newRate});
                      }}
                      min="0"
                      max="100"
                      className="w-full p-4 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-2xl outline-none transition-all dark:text-white"
                    />
                    <p className="text-xs text-gray-400 mt-1">Bunga flat per bulan dari total pinjaman</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Wallet size={12} /> Minimal Pinjaman (IDR)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">Rp</span>
                    <input 
                      type="number" 
                      value={loanSettings.min_loan_amount}
                      onChange={(e) => setLoanSettings({...loanSettings, min_loan_amount: parseInt(e.target.value) || 100000})}
                      min="100000"
                      step="50000"
                      className="w-full pl-12 pr-4 p-4 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-2xl outline-none transition-all dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Wallet size={12} /> Maksimal Pinjaman (IDR)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">Rp</span>
                    <input 
                      type="number" 
                      value={loanSettings.max_loan_amount}
                      onChange={(e) => setLoanSettings({...loanSettings, max_loan_amount: parseInt(e.target.value) || 50000000})}
                      min="1000000"
                      step="1000000"
                      className="w-full pl-12 pr-4 p-4 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-2xl outline-none transition-all dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl flex gap-3">
                <AlertCircle size={20} className="text-yellow-600 shrink-0 mt-0.5" />
                <div className="text-xs text-yellow-700 dark:text-yellow-400">
                  <p className="font-bold mb-1">Ketentuan Pinjaman:</p>
                  <p>• Maksimal tenor pinjaman adalah {loanSettings.max_tenor_months} bulan</p>
                  <p>• Bunga pinjaman adalah {loanSettings.default_interest_rate}% flat per bulan dari total pinjaman</p>
                  <p>• Angsuran akan dipotong otomatis dari gaji setiap bulan</p>
                  <p>• Pinjaman minimal Rp {loanSettings.min_loan_amount.toLocaleString('id-ID')} dan maksimal Rp {loanSettings.max_loan_amount.toLocaleString('id-ID')}</p>
                </div>
              </div>

              <div className="flex justify-end">
                <button 
                  onClick={handleSaveLoanSettings}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-6 py-3 bg-imigrasi-primary text-white rounded-xl text-sm font-bold hover:bg-blue-900 transition-colors"
                >
                  {isLoading ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                  Simpan Pengaturan Pinjaman
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Saving Type Modal */}
      <AnimatePresence>
        {showSavingTypeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={resetSavingTypeModal}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-5 border-b border-gray-100 dark:border-neutral-700 flex items-center justify-between bg-imigrasi-primary text-white">
                <h3 className="font-bold text-lg">
                  {editingSavingType ? 'Edit Jenis Simpanan' : 'Tambah Jenis Simpanan'}
                </h3>
                <button onClick={resetSavingTypeModal} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Nama Simpanan</label>
                  <input 
                    type="text" 
                    value={newSavingTypeName}
                    onChange={(e) => setNewSavingTypeName(e.target.value)}
                    placeholder="Contoh: Simpanan Pendidikan"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-xl outline-none transition-all dark:text-white"
                    disabled={editingSavingType?.name === 'Pokok' || editingSavingType?.name === 'Wajib' || editingSavingType?.name === 'Sukarela'}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Nominal Default (IDR)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">Rp</span>
                    <input 
                      type="number" 
                      value={newSavingTypeAmount}
                      onChange={(e) => setNewSavingTypeAmount(e.target.value)}
                      placeholder="Contoh: 100000"
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-xl outline-none transition-all dark:text-white"
                    />
                  </div>
                </div>
                
                <div className="flex gap-3 pt-3">
                  <button
                    onClick={resetSavingTypeModal}
                    className="flex-1 px-4 py-2 bg-gray-100 dark:bg-neutral-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSaveSavingType}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 bg-imigrasi-primary text-white font-bold rounded-xl hover:bg-blue-900 transition-colors flex items-center justify-center gap-2"
                  >
                    {isLoading ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                    Simpan
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Settings;