import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wallet, TrendingUp, HandCoins, ArrowUpRight, ArrowDownRight, 
  RefreshCw, PieChart, Calculator, CheckCircle2, AlertCircle,
  X, Save, Download, Settings, Users, DollarSign, Clock, 
  FileText, Filter, Plus, Edit, Trash2, ShoppingBag, Calendar,
  Percent, CreditCard, Receipt, Building2, Heart, Users as UsersIcon,
  ShieldCheck, Landmark
} from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import api from '../../services/api';

interface FinancialData {
  total_cash: number;
  total_savings: number;
  total_loans: number;
  total_loan_amount: number;
  total_installments: number;
  total_interest_income: number;
  total_kantin_income: number;
  total_expenses: number;
  expenses_by_category: Record<string, number>;
  total_shu: number;
  shu_distribution: {
    member: { percentage: number; amount: number };
    reserve: { percentage: number; amount: number };
    capital: { percentage: number; amount: number };
    social: { percentage: number; amount: number };
    management: { percentage: number; amount: number };
    supervisor: { percentage: number; amount: number };
  };
  active_loans_count: number;
  total_members: number;
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
}

interface KantinIncome {
  id: number;
  income_date: string;
  description: string;
  amount: number;
  payment_method: string;
  notes: string;
  creator: { name: string };
}

interface Expense {
  id: number;
  expense_date: string;
  description: string;
  amount: number;
  category: string;
  payment_method: string;
  notes: string;
  creator: { name: string };
}

interface SHUCalculationResult {
  year: number;
  total_shu: number;
  total_income: number;
  total_expense: number;
  loan_interest_total: number;
  kantin_income_total: number;
  member_percentage: number;
  member_amount: number;
  reserve_percentage: number;
  reserve_amount: number;
  capital_percentage: number;
  capital_amount: number;
  social_percentage: number;
  social_amount: number;
  management_percentage: number;
  management_amount: number;
  supervisor_percentage: number;
  supervisor_amount: number;
  is_processed: boolean;
}

interface KantinForm {
  id: number | null;
  income_date: string;
  description: string;
  amount: string;
  payment_method: string;
  notes: string;
}

interface ExpenseForm {
  id: number | null;
  expense_date: string;
  description: string;
  amount: string;
  category: string;
  payment_method: string;
  notes: string;
}

const EXPENSE_CATEGORIES = [
  { value: 'operasional', label: 'Operasional Kantor', icon: <Building2 size={14} /> },
  { value: 'gaji', label: 'Gaji Karyawan', icon: <UsersIcon size={14} /> },
  { value: 'perawatan', label: 'Perawatan & Perbaikan', icon: <Settings size={14} /> },
  { value: 'promosi', label: 'Promosi & Marketing', icon: <TrendingUp size={14} /> },
  { value: 'sosial', label: 'Dana Sosial', icon: <Heart size={14} /> },
  { value: 'lainnya', label: 'Lainnya', icon: <FileText size={14} /> },
];

const FinancialManagement: React.FC = () => {
  const { addNotification } = useNotifications();
  const [isLoading, setIsLoading] = useState(false);
  const [showSHUModal, setShowSHUModal] = useState(false);
  const [showKantinModal, setShowKantinModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [shuStep, setShuStep] = useState(1);
  const [activeTab, setActiveTab] = useState<'summary' | 'transactions' | 'kantin' | 'expenses'>('summary');
  
  const [financialData, setFinancialData] = useState<FinancialData>({
    total_cash: 0,
    total_savings: 0,
    total_loans: 0,
    total_loan_amount: 0,
    total_installments: 0,
    total_interest_income: 0,
    total_kantin_income: 0,
    total_expenses: 0,
    expenses_by_category: {},
    total_shu: 0,
    shu_distribution: {
      member: { percentage: 50, amount: 0 },
      reserve: { percentage: 10, amount: 0 },
      capital: { percentage: 25, amount: 0 },
      social: { percentage: 5, amount: 0 },
      management: { percentage: 5, amount: 0 },
      supervisor: { percentage: 5, amount: 0 }
    },
    active_loans_count: 0,
    total_members: 0
  });
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [kantinIncomes, setKantinIncomes] = useState<KantinIncome[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [transactionFilter, setTransactionFilter] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return now.toISOString().slice(0, 7);
  });
  
  const [shuCalculation, setShuCalculation] = useState<SHUCalculationResult | null>(null);
  
  const [kantinForm, setKantinForm] = useState<KantinForm>({
    id: null,
    income_date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    payment_method: 'cash',
    notes: ''
  });
  
  const [expenseForm, setExpenseForm] = useState<ExpenseForm>({
    id: null,
    expense_date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    category: 'operasional',
    payment_method: 'cash',
    notes: ''
  });

  const [kantinTotal, setKantinTotal] = useState(0);
  const [expenseTotal, setExpenseTotal] = useState(0);

  const formatCurrency = (amount: number) => {
    if (isNaN(amount) || amount === null || amount === undefined) {
      return 'Rp 0';
    }
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
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

  const fetchFinancialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/financial/summary');
      if (response.data.success) {
        setFinancialData(response.data.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch financial data:', error);
      addNotification({
        title: 'Gagal',
        message: error.response?.data?.message || 'Gagal memuat data keuangan',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  }, [addNotification]);

  const fetchTransactions = useCallback(async () => {
    try {
      const response = await api.get('/financial/transactions', {
        params: { type: transactionFilter, month: selectedMonth, limit: 100 }
      });
      if (response.data.success) {
        setTransactions(response.data.data || []);
      }
    } catch (error: any) {
      console.error('Failed to fetch transactions:', error);
      setTransactions([]);
    }
  }, [transactionFilter, selectedMonth]);

  const fetchKantinIncomes = useCallback(async () => {
    try {
      const response = await api.get('/kantin-incomes', {
        params: { month: selectedMonth }
      });
      if (response.data.success) {
        setKantinIncomes(response.data.data || []);
        setKantinTotal(response.data.total || 0);
      }
    } catch (error: any) {
      console.error('Failed to fetch kantin incomes:', error);
      setKantinIncomes([]);
      setKantinTotal(0);
    }
  }, [selectedMonth]);

  const fetchExpenses = useCallback(async () => {
    try {
      const response = await api.get('/expenses', {
        params: { month: selectedMonth }
      });
      if (response.data.success) {
        setExpenses(response.data.data || []);
        setExpenseTotal(response.data.total || 0);
      }
    } catch (error: any) {
      console.error('Failed to fetch expenses:', error);
      setExpenses([]);
      setExpenseTotal(0);
    }
  }, [selectedMonth]);

  useEffect(() => {
    fetchFinancialData();
    fetchTransactions();
    fetchKantinIncomes();
    fetchExpenses();
  }, [fetchFinancialData, fetchTransactions, fetchKantinIncomes, fetchExpenses]);

  // KANTIN METHODS
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
      
      const response = await api.post('/kantin-incomes', {
        income_date: formattedDate,
        description: kantinForm.description,
        amount: parseFloat(kantinForm.amount),
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
      
      const response = await api.put(`/kantin-incomes/${kantinForm.id}`, {
        income_date: formattedDate,
        description: kantinForm.description,
        amount: parseFloat(kantinForm.amount),
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
      const response = await api.delete(`/kantin-incomes/${id}`);
      if (response.data.success) {
        addNotification({
          title: 'Berhasil',
          message: 'Pemasukan kantin berhasil dihapus',
          type: 'success'
        });
        fetchKantinIncomes();
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
      payment_method: 'cash',
      notes: ''
    });
  };

  const editKantinIncome = (income: KantinIncome) => {
    setKantinForm({
      id: income.id,
      income_date: income.income_date,
      description: income.description,
      amount: income.amount.toString(),
      payment_method: income.payment_method,
      notes: income.notes || ''
    });
    setShowKantinModal(true);
  };

  // EXPENSE METHODS
  const handleAddExpense = async () => {
    if (!expenseForm.description || !expenseForm.amount) {
      addNotification({
        title: 'Validasi Gagal',
        message: 'Harap isi deskripsi dan jumlah pengeluaran',
        type: 'error'
      });
      return;
    }

    setIsLoading(true);
    try {
      const formattedDate = expenseForm.expense_date.split('T')[0];
      
      const response = await api.post('/expenses', {
        expense_date: formattedDate,
        description: expenseForm.description,
        amount: parseFloat(expenseForm.amount),
        category: expenseForm.category,
        payment_method: expenseForm.payment_method,
        notes: expenseForm.notes
      });

      if (response.data.success) {
        addNotification({
          title: 'Berhasil',
          message: 'Pengeluaran berhasil ditambahkan',
          type: 'success'
        });
        setShowExpenseModal(false);
        resetExpenseForm();
        fetchExpenses();
        fetchFinancialData();
      }
    } catch (error: any) {
      console.error('Error:', error);
      addNotification({
        title: 'Gagal',
        message: error.response?.data?.message || 'Gagal menambahkan pengeluaran',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateExpense = async () => {
    if (!expenseForm.id) return;

    setIsLoading(true);
    try {
      const formattedDate = expenseForm.expense_date.split('T')[0];
      
      const response = await api.put(`/expenses/${expenseForm.id}`, {
        expense_date: formattedDate,
        description: expenseForm.description,
        amount: parseFloat(expenseForm.amount),
        category: expenseForm.category,
        payment_method: expenseForm.payment_method,
        notes: expenseForm.notes
      });

      if (response.data.success) {
        addNotification({
          title: 'Berhasil',
          message: 'Pengeluaran berhasil diupdate',
          type: 'success'
        });
        setShowExpenseModal(false);
        resetExpenseForm();
        fetchExpenses();
        fetchFinancialData();
      }
    } catch (error: any) {
      console.error('Error:', error);
      addNotification({
        title: 'Gagal',
        message: error.response?.data?.message || 'Gagal mengupdate pengeluaran',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteExpense = async (id: number) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus pengeluaran ini?')) return;

    setIsLoading(true);
    try {
      const response = await api.delete(`/expenses/${id}`);
      if (response.data.success) {
        addNotification({
          title: 'Berhasil',
          message: 'Pengeluaran berhasil dihapus',
          type: 'success'
        });
        fetchExpenses();
        fetchFinancialData();
      }
    } catch (error: any) {
      addNotification({
        title: 'Gagal',
        message: error.response?.data?.message || 'Gagal menghapus pengeluaran',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetExpenseForm = () => {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    
    setExpenseForm({
      id: null,
      expense_date: formattedDate,
      description: '',
      amount: '',
      category: 'operasional',
      payment_method: 'cash',
      notes: ''
    });
  };

  const editExpense = (expense: Expense) => {
    setExpenseForm({
      id: expense.id,
      expense_date: expense.expense_date,
      description: expense.description,
      amount: expense.amount.toString(),
      category: expense.category,
      payment_method: expense.payment_method,
      notes: expense.notes || ''
    });
    setShowExpenseModal(true);
  };

  // SHU METHODS
  const handleCalculateSHU = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/shu/calculate');
      if (response.data.success) {
        setShuCalculation(response.data.data);
        setShuStep(2);
        addNotification({
          title: 'Perhitungan Selesai',
          message: response.data.message,
          type: 'success'
        });
      } else {
        addNotification({
          title: 'Gagal',
          message: response.data.message || 'Gagal menghitung SHU',
          type: 'error'
        });
      }
    } catch (error: any) {
      console.error('Error calculating SHU:', error);
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
    if (!shuCalculation) return;
    
    setIsLoading(true);
    try {
      const response = await api.post('/shu/process', {
        year: shuCalculation.year,
        total_shu: shuCalculation.total_shu,
        member_percentage: shuCalculation.member_percentage,
        reserve_percentage: shuCalculation.reserve_percentage,
        capital_percentage: shuCalculation.capital_percentage,
        social_percentage: shuCalculation.social_percentage,
        management_percentage: shuCalculation.management_percentage,
        supervisor_percentage: shuCalculation.supervisor_percentage,
        total_income: shuCalculation.total_income,
        total_expense: shuCalculation.total_expense,
        kantin_income_total: shuCalculation.kantin_income_total,
        loan_interest_total: shuCalculation.loan_interest_total,
        notes: `Distribusi SHU tahun ${shuCalculation.year}`
      });
      
      if (response.data.success) {
        setShuStep(3);
        addNotification({
          title: 'SHU Berhasil Didistribusikan',
          message: response.data.message,
          type: 'success'
        });
        fetchFinancialData();
      } else {
        addNotification({
          title: 'Gagal',
          message: response.data.message,
          type: 'error'
        });
      }
    } catch (error: any) {
      console.error('Error distributing SHU:', error);
      addNotification({
        title: 'Gagal',
        message: error.response?.data?.message || 'Gagal mendistribusikan SHU',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
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
      case 'expense':
        return <ArrowDownRight size={16} className="text-red-600" />;
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
      case 'expense':
        return 'bg-red-100';
      default:
        return 'bg-gray-100';
    }
  };

  const getCategoryLabel = (categoryValue: string) => {
    const cat = EXPENSE_CATEGORIES.find(c => c.value === categoryValue);
    return cat ? cat.label : categoryValue;
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
              <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white">
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
                      shuStep >= step ? "bg-blue-600 text-white scale-110" : "bg-gray-100 dark:bg-neutral-700 text-gray-400"
                    }`}>
                      {shuStep > step ? <CheckCircle2 size={14} /> : step}
                    </div>
                  ))}
                </div>

                {shuStep === 1 && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <Calculator size={28} className="text-blue-600" />
                      </div>
                      <h4 className="font-bold text-gray-900 dark:text-white">Hitung SHU Otomatis</h4>
                      <p className="text-xs text-gray-500 mt-1">Berdasarkan laba riil dari bunga pinjaman, pemasukan kantin, dan pengeluaran</p>
                    </div>
                    
                    <div className="p-3 bg-gray-50 dark:bg-neutral-700/30 rounded-xl text-sm space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Pendapatan Bunga</span>
                        <span className="font-bold">{formatCurrency(financialData.total_interest_income)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Pemasukan Kantin</span>
                        <span className="font-bold">{formatCurrency(financialData.total_kantin_income)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Pengeluaran</span>
                        <span className="font-bold text-red-600">{formatCurrency(financialData.total_expenses)}</span>
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
                      className="w-full py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isLoading ? <RefreshCw className="animate-spin" size={16} /> : 'Hitung SHU'}
                    </button>
                  </div>
                )}

                {shuStep === 2 && shuCalculation && (
                  <div className="space-y-4">
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                      <h4 className="font-bold text-emerald-900 dark:text-emerald-400 mb-3">Hasil Perhitungan SHU</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Total SHU Bersih</span>
                          <span className="font-bold">{formatCurrency(shuCalculation.total_shu)}</span>
                        </div>
                        <div className="border-t border-emerald-200 my-2" />
                        <div className="flex justify-between">
                          <span>Jasa Anggota ({shuCalculation.member_percentage}%)</span>
                          <span>{formatCurrency(shuCalculation.member_amount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Cadangan ({shuCalculation.reserve_percentage}%)</span>
                          <span>{formatCurrency(shuCalculation.reserve_amount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Modal Koperasi ({shuCalculation.capital_percentage}%)</span>
                          <span>{formatCurrency(shuCalculation.capital_amount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Dana Sosial ({shuCalculation.social_percentage}%)</span>
                          <span>{formatCurrency(shuCalculation.social_amount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Pengurus ({shuCalculation.management_percentage}%)</span>
                          <span>{formatCurrency(shuCalculation.management_amount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Pengawas ({shuCalculation.supervisor_percentage}%)</span>
                          <span>{formatCurrency(shuCalculation.supervisor_amount)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex gap-2 text-xs">
                      <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-amber-700 dark:text-amber-400">SHU Jasa Anggota ({shuCalculation.member_percentage}%) akan didistribusikan ke simpanan sukarela berdasarkan proporsi simpanan masing-masing anggota</p>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => setShuStep(1)} className="flex-1 py-2.5 bg-gray-100 dark:bg-neutral-700 text-gray-600 font-bold rounded-xl hover:bg-gray-200">Ulangi</button>
                      <button onClick={handleDistributeSHU} disabled={isLoading} className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 flex items-center justify-center gap-2">
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
                    <button onClick={() => { setShowSHUModal(false); setShuStep(1); setShuCalculation(null); }} className="w-full py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700">Selesai</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Kantin Income Modal */}
      <AnimatePresence>
        {showKantinModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => { setShowKantinModal(false); resetKantinForm(); }}
            />
            <div className="relative w-full max-w-md bg-white dark:bg-neutral-800 rounded-xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b bg-purple-600 text-white">
                <div className="flex items-center gap-2">
                  <ShoppingBag size={18} />
                  <h3 className="font-bold">{kantinForm.id ? 'Edit Pemasukan Kantin' : 'Tambah Pemasukan Kantin'}</h3>
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
                    placeholder="Contoh: Penjualan Makanan Kantin"
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
                    onChange={(e) => setKantinForm({...kantinForm, amount: e.target.value})}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 rounded-lg focus:border-purple-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1 mb-1">
                    <CreditCard size={12} /> Metode Pembayaran
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

              <div className="sticky bottom-0 flex gap-2 p-4 border-t bg-gray-50 dark:bg-neutral-800/50">
                <button
                  onClick={() => { setShowKantinModal(false); resetKantinForm(); }}
                  className="flex-1 px-3 py-2 text-sm bg-gray-200 dark:bg-neutral-700 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={kantinForm.id ? handleUpdateKantinIncome : handleAddKantinIncome}
                  disabled={isLoading}
                  className="flex-1 px-3 py-2 text-sm bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? <RefreshCw className="animate-spin" size={14} /> : <Save size={14} />}
                  {kantinForm.id ? 'Update' : 'Simpan'}
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Expense Modal */}
      <AnimatePresence>
        {showExpenseModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => { setShowExpenseModal(false); resetExpenseForm(); }}
            />
            <div className="relative w-full max-w-md bg-white dark:bg-neutral-800 rounded-xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b bg-red-600 text-white">
                <div className="flex items-center gap-2">
                  <Receipt size={18} />
                  <h3 className="font-bold">{expenseForm.id ? 'Edit Pengeluaran' : 'Tambah Pengeluaran'}</h3>
                </div>
                <button 
                  onClick={() => { setShowExpenseModal(false); resetExpenseForm(); }} 
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
                    value={expenseForm.expense_date}
                    onChange={(e) => setExpenseForm({...expenseForm, expense_date: e.target.value})}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 rounded-lg focus:border-red-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1 mb-1">
                    <FileText size={12} /> Deskripsi
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Pembelian ATK Kantor"
                    value={expenseForm.description}
                    onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 rounded-lg focus:border-red-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1 mb-1">
                    <DollarSign size={12} /> Jumlah (Rp)
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 rounded-lg focus:border-red-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1 mb-1">
                    <PieChart size={12} /> Kategori
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setExpenseForm({...expenseForm, category: cat.value})}
                        className={`px-3 py-2 text-xs rounded-lg font-medium transition-all flex items-center justify-center gap-1 ${
                          expenseForm.category === cat.value
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-100 dark:bg-neutral-700 text-gray-600'
                        }`}
                      >
                        {cat.icon}
                        {cat.label.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1 mb-1">
                    <CreditCard size={12} /> Metode Pembayaran
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setExpenseForm({...expenseForm, payment_method: 'cash'})}
                      className={`px-3 py-2 text-sm rounded-lg font-medium transition-all ${
                        expenseForm.payment_method === 'cash'
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-100 dark:bg-neutral-700 text-gray-600'
                      }`}
                    >
                      💵 Tunai
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpenseForm({...expenseForm, payment_method: 'transfer'})}
                      className={`px-3 py-2 text-sm rounded-lg font-medium transition-all ${
                        expenseForm.payment_method === 'transfer'
                          ? 'bg-red-600 text-white'
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
                    value={expenseForm.notes}
                    onChange={(e) => setExpenseForm({...expenseForm, notes: e.target.value})}
                    rows={2}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 rounded-lg focus:border-red-500 outline-none resize-none"
                  />
                </div>
              </div>

              <div className="sticky bottom-0 flex gap-2 p-4 border-t bg-gray-50 dark:bg-neutral-800/50">
                <button
                  onClick={() => { setShowExpenseModal(false); resetExpenseForm(); }}
                  className="flex-1 px-3 py-2 text-sm bg-gray-200 dark:bg-neutral-700 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={expenseForm.id ? handleUpdateExpense : handleAddExpense}
                  disabled={isLoading}
                  className="flex-1 px-3 py-2 text-sm bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? <RefreshCw className="animate-spin" size={14} /> : <Save size={14} />}
                  {expenseForm.id ? 'Update' : 'Simpan'}
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
          <p className="text-sm text-gray-500 dark:text-gray-400">Pantau arus kas, kelola simpanan, pinjaman, pemasukan kantin, dan pengeluaran</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setShowKantinModal(true)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-bold hover:bg-purple-700 transition-colors">
            <ShoppingBag size={14} /> Tambah Pemasukan
          </button>
          <button onClick={() => setShowExpenseModal(true)} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors">
            <Receipt size={14} /> Tambah Pengeluaran
          </button>
          <button onClick={() => setShowSHUModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200">
            <PieChart size={14} /> Proses SHU
          </button>
          <button onClick={() => { fetchFinancialData(); fetchTransactions(); fetchKantinIncomes(); fetchExpenses(); }} className="p-2 bg-white dark:bg-neutral-800 border rounded-lg">
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-neutral-700 pb-2">
        <button
          onClick={() => setActiveTab('summary')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'summary'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-neutral-800 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Landmark size={14} className="inline mr-1" /> Ringkasan
        </button>
        <button
          onClick={() => setActiveTab('kantin')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'kantin'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 dark:bg-neutral-800 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <ShoppingBag size={14} className="inline mr-1" /> Pemasukan Kantin
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'expenses'
              ? 'bg-red-600 text-white'
              : 'bg-gray-100 dark:bg-neutral-800 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Receipt size={14} className="inline mr-1" /> Pengeluaran
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'transactions'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-neutral-800 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <FileText size={14} className="inline mr-1" /> Riwayat Transaksi
        </button>
      </div>

      {/* Filter untuk tabs */}
      {(activeTab === 'transactions' || activeTab === 'kantin' || activeTab === 'expenses') && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-neutral-800 rounded-xl shadow-sm">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-400" />
            <select 
              value={transactionFilter} 
              onChange={(e) => setTransactionFilter(e.target.value)} 
              className="px-4 py-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:border-blue-500 outline-none text-sm"
            >
              <option value="all">Semua Transaksi</option>
              <option value="saving">Setoran Sukarela</option>
              <option value="withdrawal">Penarikan Sukarela</option>
              <option value="payroll">Potongan Payroll</option>
              <option value="loan_installment">Angsuran Pinjaman</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-gray-400" />
            <input 
              type="month" 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)} 
              className="px-4 py-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:border-blue-500 outline-none text-sm" 
            />
          </div>
        </div>
      )}

      {/* Summary Tab */}
      {activeTab === 'summary' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl text-white shadow-lg">
              <p className="text-xs opacity-80">Total Kas</p>
              <p className="text-xl font-bold">{formatCurrency(financialData.total_cash)}</p>
            </div>
            <div className="p-4 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl text-white shadow-lg">
              <p className="text-xs opacity-80">Total Simpanan</p>
              <p className="text-xl font-bold">{formatCurrency(financialData.total_savings)}</p>
            </div>
            <div className="p-4 bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl text-white shadow-lg">
              <p className="text-xs opacity-80">Piutang Pinjaman</p>
              <p className="text-xl font-bold">{formatCurrency(financialData.total_loans)}</p>
            </div>
            <div className="p-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl text-white shadow-lg">
              <p className="text-xs opacity-80">Laba (SHU)</p>
              <p className="text-xl font-bold">{formatCurrency(financialData.total_shu)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 overflow-hidden shadow-sm">
              <div className="p-4 border-b border-gray-200 dark:border-neutral-700">
                <h3 className="font-bold">Ringkasan Pendapatan & Pengeluaran</h3>
              </div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-xs text-green-600">Pendapatan Bunga</p>
                    <p className="text-lg font-bold text-green-700">{formatCurrency(financialData.total_interest_income)}</p>
                  </div>
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <p className="text-xs text-purple-600">Pemasukan Kantin</p>
                    <p className="text-lg font-bold text-purple-700">{formatCurrency(financialData.total_kantin_income)}</p>
                  </div>
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <p className="text-xs text-red-600">Total Pengeluaran</p>
                    <p className="text-lg font-bold text-red-700">{formatCurrency(financialData.total_expenses)}</p>
                  </div>
                </div>

                {Object.keys(financialData.expenses_by_category).length > 0 && (
                  <div className="border-t pt-3">
                    <p className="text-sm font-medium mb-2">Rincian Pengeluaran per Kategori:</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {Object.entries(financialData.expenses_by_category).map(([cat, amount]) => (
                        <div key={cat} className="flex justify-between">
                          <span className="text-gray-500">{getCategoryLabel(cat)}</span>
                          <span className="font-medium text-red-600">{formatCurrency(amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 overflow-hidden shadow-sm">
              <div className="p-4 border-b border-gray-200 dark:border-neutral-700">
                <h3 className="font-bold">Distribusi SHU</h3>
              </div>
              <div className="p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Jasa Anggota (50%)</span>
                  <span className="font-bold">{formatCurrency(financialData.shu_distribution.member.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Cadangan (10%)</span>
                  <span>{formatCurrency(financialData.shu_distribution.reserve.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Modal Koperasi (25%)</span>
                  <span>{formatCurrency(financialData.shu_distribution.capital.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Dana Sosial (5%)</span>
                  <span>{formatCurrency(financialData.shu_distribution.social.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Pengurus (5%)</span>
                  <span>{formatCurrency(financialData.shu_distribution.management.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Pengawas (5%)</span>
                  <span>{formatCurrency(financialData.shu_distribution.supervisor.amount)}</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-bold">
                    <span>Total SHU</span>
                    <span className="text-emerald-600">{formatCurrency(financialData.total_shu)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 border shadow-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Total Anggota Aktif</span>
                <span className="font-bold text-xl">{financialData.total_members}</span>
              </div>
            </div>
            <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 border shadow-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Pinjaman Aktif</span>
                <span className="font-bold text-xl">{financialData.active_loans_count}</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Kantin Tab */}
      {activeTab === 'kantin' && (
        <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 overflow-hidden shadow-sm">
          <div className="p-4 flex flex-wrap justify-between items-center border-b border-gray-200 dark:border-neutral-700 gap-2">
            <h3 className="font-bold flex items-center gap-2">
              <ShoppingBag size={18} className="text-purple-600" /> 
              Pemasukan Kantin - {new Date(selectedMonth + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
            </h3>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-bold">
                Total: {formatCurrency(kantinTotal)}
              </span>
              <button onClick={() => setShowKantinModal(true)} className="flex items-center gap-1 px-3 py-1 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700">
                <Plus size={12} /> Tambah
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            {kantinIncomes.length === 0 ? (
              <div className="p-8 text-center">
                <ShoppingBag size={40} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">Belum ada pemasukan kantin untuk periode ini</p>
                <button onClick={() => setShowKantinModal(true)} className="mt-3 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700">
                  + Tambah Pemasukan
                </button>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-neutral-800/50">
                  <tr>
                    <th className="px-3 py-2 text-left">Tanggal</th>
                    <th className="px-3 py-2 text-left">Deskripsi</th>
                    <th className="px-3 py-2 text-left">Metode</th>
                    <th className="px-3 py-2 text-right">Jumlah</th>
                    <th className="px-3 py-2 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {kantinIncomes.map((income) => (
                    <tr key={income.id} className="hover:bg-gray-50 dark:hover:bg-neutral-700/50">
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
                      <td className="px-3 py-2 text-right font-medium text-purple-600">{formatCurrency(income.amount)}</td>
                      <td className="px-3 py-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => editKantinIncome(income)} className="p-1 text-blue-500 hover:text-blue-700">
                            <Edit size={14} />
                          </button>
                          <button onClick={() => handleDeleteKantinIncome(income.id)} className="p-1 text-red-500 hover:text-red-700">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 dark:bg-neutral-800/50 font-medium">
                  <tr>
                    <td colSpan={3} className="px-3 py-2 text-right">TOTAL</td>
                    <td className="px-3 py-2 text-right font-bold text-purple-600">{formatCurrency(kantinTotal)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Expenses Tab */}
      {activeTab === 'expenses' && (
        <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 overflow-hidden shadow-sm">
          <div className="p-4 flex flex-wrap justify-between items-center border-b border-gray-200 dark:border-neutral-700 gap-2">
            <h3 className="font-bold flex items-center gap-2">
              <Receipt size={18} className="text-red-600" /> 
              Pengeluaran - {new Date(selectedMonth + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
            </h3>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-bold">
                Total: {formatCurrency(expenseTotal)}
              </span>
              <button onClick={() => setShowExpenseModal(true)} className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700">
                <Plus size={12} /> Tambah
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            {expenses.length === 0 ? (
              <div className="p-8 text-center">
                <Receipt size={40} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">Belum ada pengeluaran untuk periode ini</p>
                <button onClick={() => setShowExpenseModal(true)} className="mt-3 px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">
                  + Tambah Pengeluaran
                </button>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-neutral-800/50">
                  <tr>
                    <th className="px-3 py-2 text-left">Tanggal</th>
                    <th className="px-3 py-2 text-left">Deskripsi</th>
                    <th className="px-3 py-2 text-left">Kategori</th>
                    <th className="px-3 py-2 text-left">Metode</th>
                    <th className="px-3 py-2 text-right">Jumlah</th>
                    <th className="px-3 py-2 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {expenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-gray-50 dark:hover:bg-neutral-700/50">
                      <td className="px-3 py-2 text-xs">{formatDate(expense.expense_date)}</td>
                      <td className="px-3 py-2">
                        <div className="font-medium">{expense.description}</div>
                        {expense.notes && <div className="text-[10px] text-gray-400">{expense.notes}</div>}
                      </td>
                      <td className="px-3 py-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-orange-100 text-orange-700">
                          {getCategoryLabel(expense.category)}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${expense.payment_method === 'cash' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                          {expense.payment_method === 'cash' ? 'Tunai' : 'Transfer'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-red-600">{formatCurrency(expense.amount)}</td>
                      <td className="px-3 py-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => editExpense(expense)} className="p-1 text-blue-500 hover:text-blue-700">
                            <Edit size={14} />
                          </button>
                          <button onClick={() => handleDeleteExpense(expense.id)} className="p-1 text-red-500 hover:text-red-700">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 dark:bg-neutral-800/50 font-medium">
                  <tr>
                    <td colSpan={4} className="px-3 py-2 text-right">TOTAL</td>
                    <td className="px-3 py-2 text-right font-bold text-red-600">{formatCurrency(expenseTotal)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Transaction History Tab */}
      {activeTab === 'transactions' && (
        <div className="bg-white dark:bg-neutral-800 rounded-xl overflow-hidden border shadow-sm">
          <div className="p-4 border-b">
            <h3 className="font-bold">Riwayat Transaksi</h3>
          </div>
          <div className="max-h-[500px] overflow-y-auto">
            {transactions.length === 0 ? (
              <div className="p-8 text-center">
                <FileText size={40} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500">Belum ada transaksi untuk periode ini</p>
              </div>
            ) : (
              <div className="divide-y">
                {transactions.map((t) => (
                  <div key={t.id} className="p-3 hover:bg-gray-50 dark:hover:bg-neutral-700/50">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-2">
                        <div className={`p-1.5 rounded-lg ${getTransactionColor(t.type)}`}>
                          {getTransactionIcon(t.type)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{t.title}</p>
                          <p className="text-[10px] text-gray-500">{t.description}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{formatDate(t.date)} • {t.user}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold text-sm ${t.is_income ? 'text-emerald-600' : 'text-red-600'}`}>
                          {t.is_income ? '+' : '-'}{formatCurrency(t.amount)}
                        </p>
                        {t.status === 'pending' && (
                          <span className="text-[10px] text-amber-500">Menunggu Verifikasi</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialManagement;