import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  FileText, Download, PieChart, TrendingUp, Calendar, Filter, 
  FileSpreadsheet, FileCheck, RefreshCw, Share2, MessageCircle, 
  Info, Wallet, HandCoins, ShoppingBag, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import api from '../../services/api';

interface Transaction {
  id: number;
  type: string;
  category: string;
  title: string;
  description: string;
  amount: number;
  date: string;
  user: string;
  status: string;
  is_income: boolean;
}

const ReportsPage: React.FC = () => {
  const { addNotification } = useNotifications();
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/savings/financial/transactions', {
        params: { type: 'all', month: selectedMonth }
      });
      if (response.data.success) {
        setTransactions(response.data.data);
      } else {
        console.error('Failed to fetch transactions:', response.data.message);
        setTransactions([]);
      }
    } catch (error: any) {
      console.error('Failed to fetch transactions:', error);
      addNotification({
        title: 'Error',
        message: error.response?.data?.message || 'Gagal mengambil data transaksi',
        type: 'error'
      });
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [selectedMonth]);

  const totalIncome = transactions.reduce((sum, t) => sum + t.amount, 0);
  const savingsIncome = transactions.filter(t => t.type === 'saving' || t.type === 'payroll').reduce((sum, t) => sum + t.amount, 0);
  const loanIncome = transactions.filter(t => t.type === 'loan_installment').reduce((sum, t) => sum + t.amount, 0);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Laporan Keuangan</h1>
          <p className="text-gray-500 dark:text-gray-400">Unduh laporan keuangan koperasi dalam format PDF/Excel.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchTransactions}
            className="p-3 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-500 hover:text-imigrasi-primary transition-colors"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Filter Section */}
      <div className="glass-card p-6 rounded-[2.5rem] space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Periode Laporan</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="month" 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-2xl outline-none transition-all dark:text-white"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button 
            onClick={() => {
              addNotification({
                title: 'Laporan Selesai',
                message: `Laporan keuangan bulan ${formatDate(selectedMonth + '-01')} telah dibuat.`,
                type: 'success'
              });
            }}
            className="flex items-center gap-2 px-6 py-3 bg-imigrasi-primary text-white rounded-xl text-sm font-bold hover:bg-blue-900 transition-colors"
          >
            <FileSpreadsheet size={18} />
            Generate Laporan
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-3xl bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <p className="text-sm opacity-80">Total Pendapatan</p>
          <p className="text-2xl font-bold">{formatCurrency(totalIncome)}</p>
        </div>
        <div className="glass-card p-6 rounded-3xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
          <p className="text-sm opacity-80">Simpanan Masuk</p>
          <p className="text-2xl font-bold">{formatCurrency(savingsIncome)}</p>
        </div>
        <div className="glass-card p-6 rounded-3xl bg-gradient-to-r from-amber-500 to-amber-600 text-white">
          <p className="text-sm opacity-80">Angsuran Pinjaman</p>
          <p className="text-2xl font-bold">{formatCurrency(loanIncome)}</p>
        </div>
      </div>

      {/* Transaction History */}
      <div className="glass-card rounded-[2.5rem] overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-neutral-700">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white">Riwayat Transaksi</h3>
        </div>
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-12 text-center">
              <RefreshCw className="animate-spin mx-auto text-imigrasi-primary" size={32} />
              <p className="mt-4 text-gray-500">Memuat data...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 dark:bg-neutral-700 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <FileText size={40} className="text-gray-400" />
              </div>
              <p className="text-gray-500">Belum ada transaksi untuk periode ini</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-neutral-700">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="p-4 hover:bg-gray-50 dark:hover:bg-neutral-700/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        transaction.type === 'saving' ? 'bg-green-100' :
                        transaction.type === 'payroll' ? 'bg-blue-100' :
                        transaction.type === 'loan_installment' ? 'bg-amber-100' : 'bg-gray-100'
                      }`}>
                        {transaction.type === 'saving' && <Wallet size={16} className="text-green-600" />}
                        {transaction.type === 'payroll' && <TrendingUp size={16} className="text-blue-600" />}
                        {transaction.type === 'loan_installment' && <HandCoins size={16} className="text-amber-600" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{transaction.title}</p>
                        <p className="text-[10px] text-gray-500">{transaction.description}</p>
                        <p className="text-[10px] text-gray-400 mt-1">{formatDate(transaction.date)} • {transaction.user}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        +{formatCurrency(transaction.amount)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-[2rem] border border-blue-100 dark:border-blue-900/30 flex gap-4 items-center">
        <div className="p-3 bg-white dark:bg-neutral-800 rounded-2xl text-imigrasi-primary shadow-sm">
          <Info size={24} />
        </div>
        <div>
          <h4 className="font-bold text-blue-900 dark:text-blue-400">Informasi Laporan</h4>
          <p className="text-xs text-blue-800 dark:text-blue-500/80 leading-relaxed">
            Laporan keuangan dihasilkan secara otomatis berdasarkan data transaksi yang tercatat di sistem.
            Data meliputi simpanan anggota, angsuran pinjaman, dan pemasukan kantin.
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default ReportsPage;