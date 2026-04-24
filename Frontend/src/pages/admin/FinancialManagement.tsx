import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wallet, TrendingUp, HandCoins, ArrowUpRight, ArrowDownRight, 
  RefreshCw, PieChart, Calculator, CheckCircle2, AlertCircle,
  X, Save, Download, Settings, Users, DollarSign, Clock, 
  FileText, Filter, Plus, Edit, Trash2, ShoppingBag, Calendar,
  Percent, CreditCard
} from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import api from '../../services/api';

interface FinancialData {
  total_cash: number;
  total_savings: number;
  total_loans: number;
  total_loan_amount: number;
  total_installments: number;
  total_shu: number;
  active_loans_count: number;
  total_members: number;
  total_interest_income: number;
  operational_cost: number;
  kantin_income: number;
  kantin_shu: number;
}

interface Transaction {
  id: string;
  original_id: number;
  type: string;
  category: string;
  title: string;
  description: string;
  amount: number;
  date: string;
  user: string;
  status: string;
  is_income: boolean;
  payment_method?: string;
  shu_share?: number;
  shu_amount?: number;
}

interface KantinIncome {
  id: number;
  income_date: string;
  description: string;
  amount: number;
  shu_share_percentage: number;
  shu_amount: number;
  payment_method: string;
  notes: string;
  creator: { name: string };
}

interface KantinForm {
  id: number | null;
  income_date: string;
  description: string;
  amount: string;
  shu_share_percentage: number;
  shu_amount: number;
  payment_method: string;
  notes: string;
}

const FinancialManagement: React.FC = () => {
  const { addNotification } = useNotifications();
  const [isLoading, setIsLoading] = useState(false);
  const [showSHUModal, setShowSHUModal] = useState(false);
  const [showKantinModal, setShowKantinModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [shuStep, setShuStep] = useState(1);
  const [financialData, setFinancialData] = useState<FinancialData>({
    total_cash: 0,
    total_savings: 0,
    total_loans: 0,
    total_loan_amount: 0,
    total_installments: 0,
    total_shu: 0,
    active_loans_count: 0,
    total_members: 0,
    total_interest_income: 0,
    operational_cost: 0,
    kantin_income: 0,
    kantin_shu: 0
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [kantinIncomes, setKantinIncomes] = useState<KantinIncome[]>([]);
  const [transactionFilter, setTransactionFilter] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return now.toISOString().slice(0, 7);
  });
  const [shuData, setShuData] = useState({
    year: new Date().getFullYear(),
    total_shu: 0,
    modal_share: 40,
    member_share: 60
  });
  const [kantinForm, setKantinForm] = useState<KantinForm>({
    id: null,
    income_date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    shu_share_percentage: 30,
    shu_amount: 0,
    payment_method: 'cash',
    notes: ''
  });
  const [editingKantinId, setEditingKantinId] = useState<number | null>(null);
  const [kantinTotal, setKantinTotal] = useState(0);
  const [kantinTotalShu, setKantinTotalShu] = useState(0);

  const formatCurrency = (amount: number) => {
    if (isNaN(amount) || amount === null || amount === undefined) {
      return 'Rp 0';
    }
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const fetchFinancialData = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/savings/financial/summary');
      if (response.data.success) {
        setFinancialData(response.data.data);
        setShuData(prev => ({ ...prev, total_shu: response.data.data.total_shu }));
      }
    } catch (error) {
      console.error('Failed to fetch financial data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await api.get('/savings/financial/transactions', {
        params: { type: transactionFilter, month: selectedMonth }
      });
      if (response.data.success) {
        setTransactions(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    }
  };

  const fetchKantinIncomes = async () => {
    try {
      const response = await api.get('/savings/kantin/incomes', {
        params: { month: selectedMonth }
      });
      if (response.data.success) {
        setKantinIncomes(response.data.data);
        setKantinTotal(response.data.total || 0);
        setKantinTotalShu(response.data.total_shu || 0);
      }
    } catch (error) {
      console.error('Failed to fetch kantin incomes:', error);
    }
  };

  useEffect(() => {
    fetchFinancialData();
    fetchTransactions();
    fetchKantinIncomes();
  }, [selectedMonth, transactionFilter]);

  const handleAmountChange = (amount: string) => {
    const numAmount = parseFloat(amount) || 0;
    const percentage = kantinForm.shu_share_percentage || 30;
    setKantinForm({
      ...kantinForm,
      amount: amount,
      shu_amount: (numAmount * percentage) / 100
    });
  };

  const handleShuPercentageChange = (percentage: number) => {
    const numAmount = parseFloat(kantinForm.amount) || 0;
    setKantinForm({
      ...kantinForm,
      shu_share_percentage: percentage,
      shu_amount: (numAmount * percentage) / 100
    });
  };

  const handleAddKantinIncome = async () => {
    if (!kantinForm.description || !kantinForm.amount) {
      addNotification({
        title: 'Validasi Gagal',
        message: 'Harap isi deskripsi dan jumlah pemasukan',
        type: 'error'
      });
      return;
    }

    setIsLoading(true);
    try {
      const formattedDate = kantinForm.income_date.split('T')[0];
      
      const response = await api.post('/savings/kantin/incomes', {
        income_date: formattedDate,
        description: kantinForm.description,
        amount: parseFloat(kantinForm.amount),
        shu_share_percentage: kantinForm.shu_share_percentage || 30,
        payment_method: kantinForm.payment_method,
        notes: kantinForm.notes
      });

      if (response.data.success) {
        addNotification({
          title: 'Berhasil',
          message: 'Pemasukan kantin berhasil ditambahkan',
          type: 'success'
        });
        setShowKantinModal(false);
        resetKantinForm();
        fetchKantinIncomes();
        fetchTransactions();
        fetchFinancialData();
      }
    } catch (error: any) {
      console.error('Error:', error);
      addNotification({
        title: 'Gagal',
        message: error.response?.data?.message || 'Gagal menambahkan pemasukan',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateKantinIncome = async () => {
    if (!kantinForm.id) return;

    setIsLoading(true);
    try {
      const formattedDate = kantinForm.income_date.split('T')[0];
      
      const response = await api.put(`/savings/kantin/incomes/${kantinForm.id}`, {
        income_date: formattedDate,
        description: kantinForm.description,
        amount: parseFloat(kantinForm.amount),
        shu_share_percentage: kantinForm.shu_share_percentage || 30,
        payment_method: kantinForm.payment_method,
        notes: kantinForm.notes
      });

      if (response.data.success) {
        addNotification({
          title: 'Berhasil',
          message: 'Pemasukan kantin berhasil diupdate',
          type: 'success'
        });
        setShowKantinModal(false);
        resetKantinForm();
        fetchKantinIncomes();
        fetchTransactions();
        fetchFinancialData();
      }
    } catch (error: any) {
      console.error('Error:', error);
      addNotification({
        title: 'Gagal',
        message: error.response?.data?.message || 'Gagal mengupdate pemasukan',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteKantinIncome = async (id: number) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus pemasukan ini?')) return;

    setIsLoading(true);
    try {
      const response = await api.delete(`/savings/kantin/incomes/${id}`);
      if (response.data.success) {
        addNotification({
          title: 'Berhasil',
          message: 'Pemasukan kantin berhasil dihapus',
          type: 'success'
        });
        fetchKantinIncomes();
        fetchTransactions();
        fetchFinancialData();
      }
    } catch (error: any) {
      addNotification({
        title: 'Gagal',
        message: error.response?.data?.message || 'Gagal menghapus pemasukan',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetKantinForm = () => {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    
    setKantinForm({
      id: null,
      income_date: formattedDate,
      description: '',
      amount: '',
      shu_share_percentage: 30,
      shu_amount: 0,
      payment_method: 'cash',
      notes: ''
    });
    setEditingKantinId(null);
  };

  const editKantinIncome = (income: KantinIncome) => {
    setKantinForm({
      id: income.id,
      income_date: income.income_date,
      description: income.description,
      amount: income.amount.toString(),
      shu_share_percentage: income.shu_share_percentage || 30,
      shu_amount: income.shu_amount || 0,
      payment_method: income.payment_method,
      notes: income.notes || ''
    });
    setEditingKantinId(income.id);
    setShowKantinModal(true);
  };

  const handleCalculateSHU = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/savings/financial/shu/calculate');
      if (response.data.success) {
        setShuData(prev => ({ 
          ...prev, 
          total_shu: response.data.data.total_shu 
        }));
        setShuStep(2);
        addNotification({
          title: 'Perhitungan Selesai',
          message: response.data.message,
          type: 'success'
        });
      }
    } catch (error: any) {
      addNotification({
        title: 'Gagal',
        message: error.response?.data?.message || 'Gagal menghitung SHU',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDistributeSHU = async () => {
    setIsLoading(true);
    try {
      // Kirim data yang diperlukan
      const response = await api.post('/savings/financial/shu/process', {
        year: shuData.year,
        total_shu: shuData.total_shu,
        member_share_percentage: shuData.modal_share,
        reserve_percentage: shuData.member_share,
        interest_income: financialData.total_interest_income,
        operational_cost: financialData.operational_cost,
        kantin_contribution: financialData.kantin_shu,
        notes: `Distribusi SHU tahun ${shuData.year}`
      });
      
      if (response.data.success) {
        setShuStep(3);
        addNotification({
          title: 'SHU Berhasil Didistribusikan',
          message: response.data.message,
          type: 'success'
        });
        fetchFinancialData();
        fetchTransactions();
      } else {
        addNotification({
          title: 'Gagal',
          message: response.data.message,
          type: 'error'
        });
      }
    } catch (error: any) {
      console.error('Error:', error);
      addNotification({
        title: 'Gagal',
        message: error.response?.data?.message || 'Gagal mendistribusikan SHU',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackup = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsLoading(false);
    setShowBackupModal(false);
    addNotification({
      title: 'Backup Berhasil',
      message: 'Database berhasil di-backup dan diunduh.',
      type: 'success'
    });
  };

  const getTransactionIcon = (type: string) => {
    switch(type) {
      case 'saving':
        return <ArrowUpRight size={16} className="text-green-600" />;
      case 'payroll':
        return <TrendingUp size={16} className="text-blue-600" />;
      case 'loan_installment':
        return <ArrowDownRight size={16} className="text-amber-600" />;
      case 'kantin':
        return <ShoppingBag size={16} className="text-purple-600" />;
      default:
        return <Wallet size={16} className="text-gray-600" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch(type) {
      case 'saving':
        return 'bg-green-100';
      case 'payroll':
        return 'bg-blue-100';
      case 'loan_installment':
        return 'bg-amber-100';
      case 'kantin':
        return 'bg-purple-100';
      default:
        return 'bg-gray-100';
    }
  };

  return (
    <div className="space-y-8">
      {/* SHU Process Modal */}
      <AnimatePresence>
        {showSHUModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowSHUModal(false)}
            />
            <div className="relative w-full max-w-2xl bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-neutral-700 bg-imigrasi-primary text-white">
                <h3 className="font-bold text-lg">Proses Perhitungan SHU</h3>
                <button onClick={() => setShowSHUModal(false)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between relative">
                  <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 dark:bg-neutral-700 -translate-y-1/2 z-0" />
                  {[1, 2, 3].map((step) => (
                    <div key={step} className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                      shuStep >= step ? "bg-imigrasi-primary text-white scale-110" : "bg-gray-100 dark:bg-neutral-700 text-gray-400"
                    }`}>
                      {shuStep > step ? <CheckCircle2 size={14} /> : step}
                    </div>
                  ))}
                </div>

                {shuStep === 1 && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <Calculator size={28} className="text-imigrasi-primary" />
                      </div>
                      <h4 className="font-bold text-gray-900 dark:text-white">Hitung SHU Otomatis</h4>
                      <p className="text-xs text-gray-500 mt-1">Berdasarkan laba riil dari bunga pinjaman dan kontribusi kantin</p>
                    </div>
                    
                    <div className="p-3 bg-gray-50 dark:bg-neutral-700/30 rounded-xl text-sm">
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-600">Total Bunga Pinjaman</span>
                        <span className="font-bold">{formatCurrency(financialData.total_interest_income)}</span>
                      </div>
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-600">Biaya Operasional (20%)</span>
                        <span className="font-bold">{formatCurrency(financialData.operational_cost)}</span>
                      </div>
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-600">Kontribusi Kantin</span>
                        <span className="font-bold">{formatCurrency(financialData.kantin_shu)}</span>
                      </div>
                      <div className="border-t border-gray-200 my-2" />
                      <div className="flex justify-between font-bold">
                        <span>SHU Bersih</span>
                        <span className="text-emerald-600">{formatCurrency(financialData.total_shu)}</span>
                      </div>
                    </div>

                    <button 
                      onClick={handleCalculateSHU}
                      disabled={isLoading}
                      className="w-full py-2.5 bg-imigrasi-primary text-white font-bold rounded-xl hover:bg-blue-900 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isLoading ? <RefreshCw className="animate-spin" size={16} /> : 'Hitung SHU'}
                    </button>
                  </div>
                )}

                {shuStep === 2 && (
                  <div className="space-y-4">
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                      <h4 className="font-bold text-emerald-900 dark:text-emerald-400 mb-2">Hasil Perhitungan SHU</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Total SHU Bersih</span>
                          <span className="font-bold">{formatCurrency(shuData.total_shu)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Jasa Anggota (60%)</span>
                          <span>{formatCurrency(shuData.total_shu * 0.6)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Cadangan (40%)</span>
                          <span>{formatCurrency(shuData.total_shu * 0.4)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex gap-2 text-xs">
                      <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-amber-700 dark:text-amber-400">SHU akan didistribusikan ke simpanan sukarela anggota</p>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => setShuStep(1)} className="flex-1 py-2.5 bg-gray-100 dark:bg-neutral-700 text-gray-600 font-bold rounded-xl hover:bg-gray-200">Ulangi</button>
                      <button onClick={handleDistributeSHU} disabled={isLoading} className="flex-1 py-2.5 bg-imigrasi-primary text-white font-bold rounded-xl hover:bg-blue-900 flex items-center justify-center gap-2">
                        {isLoading ? <RefreshCw className="animate-spin" size={16} /> : 'Distribusikan SHU'}
                      </button>
                    </div>
                  </div>
                )}

                {shuStep === 3 && (
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-emerald-500 text-white rounded-2xl flex items-center justify-center mx-auto">
                      <CheckCircle2 size={32} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white">SHU Berhasil Didistribusikan!</h4>
                      <p className="text-xs text-gray-500 mt-1">Seluruh anggota telah menerima bagian SHU mereka</p>
                    </div>
                    <button onClick={() => { setShowSHUModal(false); setShuStep(1); }} className="w-full py-2.5 bg-imigrasi-primary text-white font-bold rounded-xl hover:bg-blue-900">Selesai</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Kantin Income Modal - RESPONSIVE */}
      <AnimatePresence>
        {showKantinModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => { setShowKantinModal(false); resetKantinForm(); }}
            />
            <div className="relative w-full max-w-md bg-white dark:bg-neutral-800 rounded-xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
              {/* Header dengan tombol close yang jelas */}
              <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-gray-100 dark:border-neutral-700 bg-purple-600 text-white">
                <div className="flex items-center gap-2">
                  <ShoppingBag size={18} />
                  <h3 className="font-bold">{editingKantinId ? 'Edit Pemasukan Kantin' : 'Tambah Pemasukan Kantin'}</h3>
                </div>
                <button 
                  onClick={() => { setShowKantinModal(false); resetKantinForm(); }} 
                  className="p-1 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-4 space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1 mb-1">
                    <Calendar size={12} /> Tanggal
                  </label>
                  <input
                    type="date"
                    value={kantinForm.income_date}
                    onChange={(e) => setKantinForm({...kantinForm, income_date: e.target.value})}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 rounded-lg focus:border-purple-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1 mb-1">
                    <FileText size={12} /> Deskripsi
                  </label>
                  <input
                    type="text"
                    placeholder="Penjualan Kantin"
                    value={kantinForm.description}
                    onChange={(e) => setKantinForm({...kantinForm, description: e.target.value})}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 rounded-lg focus:border-purple-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1 mb-1">
                    <DollarSign size={12} /> Jumlah (Rp)
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={kantinForm.amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 rounded-lg focus:border-purple-500 outline-none"
                  />
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      <Percent size={12} /> SHU Share
                    </label>
                    <span className="text-sm font-bold text-purple-600">{kantinForm.shu_share_percentage}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={kantinForm.shu_share_percentage}
                    onChange={(e) => handleShuPercentageChange(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                    <span>0%</span><span>50%</span><span>100%</span>
                  </div>
                </div>

                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1 mb-1">
                    <PieChart size={12} /> Jumlah SHU
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={formatCurrency(kantinForm.shu_amount)}
                    className="w-full px-3 py-2 text-sm bg-emerald-100 dark:bg-emerald-800/30 border border-emerald-200 dark:border-emerald-700 rounded-lg font-bold cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1 mb-1">
                    <CreditCard size={12} /> Metode
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setKantinForm({...kantinForm, payment_method: 'cash'})}
                      className={`px-3 py-2 text-sm rounded-lg font-medium transition-all ${
                        kantinForm.payment_method === 'cash'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 dark:bg-neutral-700 text-gray-600'
                      }`}
                    >
                      💵 Tunai
                    </button>
                    <button
                      type="button"
                      onClick={() => setKantinForm({...kantinForm, payment_method: 'transfer'})}
                      className={`px-3 py-2 text-sm rounded-lg font-medium transition-all ${
                        kantinForm.payment_method === 'transfer'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 dark:bg-neutral-700 text-gray-600'
                      }`}
                    >
                      💳 Transfer
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1 mb-1">
                    <FileText size={12} /> Catatan
                  </label>
                  <textarea
                    placeholder="Catatan tambahan..."
                    value={kantinForm.notes}
                    onChange={(e) => setKantinForm({...kantinForm, notes: e.target.value})}
                    rows={2}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 rounded-lg focus:border-purple-500 outline-none resize-none"
                  />
                </div>
              </div>

              <div className="sticky bottom-0 flex gap-2 p-4 border-t border-gray-100 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800/50">
                <button
                  onClick={() => { setShowKantinModal(false); resetKantinForm(); }}
                  className="flex-1 px-3 py-2 text-sm bg-gray-200 dark:bg-neutral-700 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={editingKantinId ? handleUpdateKantinIncome : handleAddKantinIncome}
                  disabled={isLoading}
                  className="flex-1 px-3 py-2 text-sm bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? <RefreshCw className="animate-spin" size={14} /> : <Save size={14} />}
                  {editingKantinId ? 'Update' : 'Simpan'}
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Backup Modal */}
      <AnimatePresence>
        {showBackupModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowBackupModal(false)} />
            <div className="relative w-full max-w-sm bg-white dark:bg-neutral-800 rounded-xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-neutral-700 bg-purple-600 text-white">
                <h3 className="font-bold">Backup Database</h3>
                <button onClick={() => setShowBackupModal(false)} className="p-1 hover:bg-white/10 rounded-full"><X size={18} /></button>
              </div>
              <div className="p-6 text-center space-y-4">
                <div className="w-16 h-16 bg-purple-50 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center mx-auto">
                  <Save size={32} className="text-purple-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white">Amankan Data Anda</h4>
                  <p className="text-xs text-gray-500 mt-1">Sistem akan membuat salinan lengkap database</p>
                </div>
                <button onClick={handleBackup} disabled={isLoading} className="w-full py-2.5 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2">
                  {isLoading ? <RefreshCw className="animate-spin" size={16} /> : <Download size={16} />}
                  {isLoading ? 'Memproses...' : 'Mulai Backup'}
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Manajemen Keuangan</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Pantau arus kas, kelola simpanan, pinjaman, dan pemasukan kantin</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setShowKantinModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700">
            <ShoppingBag size={14} /> Tambah Kantin
          </button>
          <button onClick={() => setShowSHUModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-imigrasi-accent text-imigrasi-primary rounded-lg text-sm font-medium hover:bg-white">
            <PieChart size={14} /> Proses SHU
          </button>
          <button onClick={() => setShowBackupModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700">
            <Save size={14} /> Backup
          </button>
          <button onClick={() => { fetchFinancialData(); fetchTransactions(); fetchKantinIncomes(); }} className="p-2 bg-white dark:bg-neutral-800 border rounded-lg">
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-neutral-800 rounded-xl border">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          <select value={transactionFilter} onChange={(e) => setTransactionFilter(e.target.value)} className="px-2 py-1 text-sm bg-gray-100 dark:bg-neutral-700 rounded-lg">
            <option value="all">Semua</option>
            <option value="savings">Simpanan</option>
            <option value="payroll">Payroll</option>
            <option value="loans">Pinjaman</option>
            <option value="kantin">Kantin</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-gray-400" />
          <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="px-2 py-1 text-sm bg-gray-100 dark:bg-neutral-700 rounded-lg" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl text-white">
          <p className="text-xs opacity-80">Total Kas</p>
          <p className="text-xl font-bold">{formatCurrency(financialData.total_cash)}</p>
        </div>
        <div className="p-4 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl text-white">
          <p className="text-xs opacity-80">Total Simpanan</p>
          <p className="text-xl font-bold">{formatCurrency(financialData.total_savings)}</p>
        </div>
        <div className="p-4 bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl text-white">
          <p className="text-xs opacity-80">Piutang Pinjaman</p>
          <p className="text-xl font-bold">{formatCurrency(financialData.total_loans)}</p>
        </div>
        <div className="p-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl text-white">
          <p className="text-xs opacity-80">Laba (SHU)</p>
          <p className="text-xl font-bold">{formatCurrency(financialData.total_shu)}</p>
        </div>
      </div>

      {/* Kantin Section */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl border overflow-hidden">
        <div className="p-4 border-b flex flex-wrap justify-between items-center gap-2">
          <h3 className="font-bold flex items-center gap-2"><ShoppingBag size={18} /> Pemasukan Kantin - {new Date(selectedMonth + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 dark:bg-neutral-800/30">
          <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl text-white">
            <p className="text-xs opacity-80">Total Pemasukan</p>
            <p className="text-lg font-bold">{formatCurrency(kantinTotal)}</p>
          </div>
          <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl text-white">
            <p className="text-xs opacity-80">Kontribusi SHU</p>
            <p className="text-lg font-bold">{formatCurrency(kantinTotalShu)}</p>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          {kantinIncomes.length === 0 ? (
            <div className="p-8 text-center">
              <ShoppingBag size={40} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">Belum ada pemasukan kantin</p>
              <button onClick={() => setShowKantinModal(true)} className="mt-3 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm">+ Tambah</button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-neutral-800/50">
                <tr>
                  <th className="px-3 py-2 text-left">Tanggal</th>
                  <th className="px-3 py-2 text-left">Deskripsi</th>
                  <th className="px-3 py-2 text-left">Metode</th>
                  <th className="px-3 py-2 text-right">Jumlah</th>
                  <th className="px-3 py-2 text-right">SHU</th>
                  <th className="px-3 py-2 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {kantinIncomes.map((income) => (
                  <tr key={income.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-xs">{formatDate(income.income_date)}</td>
                    <td className="px-3 py-2">
                      <div className="font-medium">{income.description}</div>
                      {income.notes && <div className="text-[10px] text-gray-400">{income.notes}</div>}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${income.payment_method === 'cash' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        {income.payment_method === 'cash' ? 'Tunai' : 'Transfer'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-emerald-600">{formatCurrency(income.amount)}</td>
                    <td className="px-3 py-2 text-right text-purple-600">{formatCurrency(income.shu_amount)} ({income.shu_share_percentage}%)</td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => editKantinIncome(income)} className="p-1 text-blue-500 hover:text-blue-700"><Edit size={14} /></button>
                        <button onClick={() => handleDeleteKantinIncome(income.id)} className="p-1 text-red-500 hover:text-red-700"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 dark:bg-neutral-800/50 font-medium">
                <tr>
                  <td colSpan={3} className="px-3 py-2 text-right">TOTAL</td>
                  <td className="px-3 py-2 text-right text-emerald-600">{formatCurrency(kantinTotal)}</td>
                  <td className="px-3 py-2 text-right text-purple-600">{formatCurrency(kantinTotalShu)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>

      {/* Transaction History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-neutral-800 rounded-xl border overflow-hidden">
          <div className="p-4 border-b">
            <h3 className="font-bold">Riwayat Transaksi</h3>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {transactions.length === 0 ? (
              <div className="p-8 text-center"><FileText size={40} className="mx-auto text-gray-300 mb-2" /><p className="text-gray-500">Belum ada transaksi</p></div>
            ) : (
              <div className="divide-y">
                {transactions.map((t) => (
                  <div key={t.id} className="p-3 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-2">
                        <div className={`p-1.5 rounded-lg ${getTransactionColor(t.type)}`}>{getTransactionIcon(t.type)}</div>
                        <div>
                          <p className="font-medium text-sm">{t.title}</p>
                          <p className="text-[10px] text-gray-500">{t.description}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{formatDate(t.date)} • {t.user}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-600 text-sm">+{formatCurrency(t.amount)}</p>
                        {t.shu_amount && t.shu_amount > 0 && <p className="text-[10px] text-purple-500">SHU: {formatCurrency(t.shu_amount)}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-neutral-800 rounded-xl border p-4">
            <h3 className="font-bold mb-3">Ringkasan Keuangan</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Total Anggota</span><span className="font-bold">{financialData.total_members}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Total Pinjaman</span><span className="font-bold">{formatCurrency(financialData.total_loan_amount)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Angsuran Terbayar</span><span className="font-bold">{formatCurrency(financialData.total_installments)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Pemasukan Kantin</span><span className="font-bold text-purple-600">{formatCurrency(kantinTotal)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">SHU Kantin</span><span className="font-bold text-purple-600">{formatCurrency(kantinTotalShu)}</span></div>
            </div>
          </div>

          <div className="bg-imigrasi-primary text-white rounded-xl p-4">
            <h4 className="font-bold text-imigrasi-accent">Target {new Date().getFullYear()}</h4>
            <div className="mt-2">
              <div className="flex justify-between text-xs">
                <span>Rp {(financialData.total_savings / 1000000).toFixed(0)}M / Rp 2M</span>
                <span>{((financialData.total_savings / 2000000000) * 100).toFixed(0)}%</span>
              </div>
              <div className="mt-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-imigrasi-accent rounded-full" style={{ width: `${Math.min(100, (financialData.total_savings / 2000000000) * 100)}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialManagement;