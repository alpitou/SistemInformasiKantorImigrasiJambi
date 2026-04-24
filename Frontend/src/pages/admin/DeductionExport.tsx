import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Download, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Wallet, 
  RefreshCw,
  FileSpreadsheet,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import axios from 'axios';

interface MemberDeduction {
  id: number;
  name: string;
  nip: string;
  unit: string;
  pokok: number;
  wajib: number;
  sukarela: number;
  loan_installment: number;
  total: number;
}

const DeductionExport: React.FC = () => {
  const { addNotification } = useNotifications();
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return now.toISOString().slice(0, 7);
  });
  const [deductions, setDeductions] = useState<MemberDeduction[]>([]);
  const [summary, setSummary] = useState({
    total_pokok: 0,
    total_wajib: 0,
    total_sukarela: 0,
    total_loan: 0,
    total_all: 0
  });

  const token = localStorage.getItem('token');
  const axiosInstance = useMemo(() => axios.create({
    baseURL: '/api',
    headers: { Authorization: `Bearer ${token}` }
  }), [token]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const fetchDeductions = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get('/savings/payroll/members', {
        params: { month: selectedMonth }
      });
      
      if (response.data.success) {
        const members = response.data.data;
        
        let totalPokok = 0;
        let totalWajib = 0;
        let totalLoan = 0;
        
        const deductionData: MemberDeduction[] = members.map((member: any) => {
          const pokok = member.savings.find((s: any) => s.type_name === 'Pokok')?.default_amount || 0;
          const wajib = member.savings.find((s: any) => s.type_name === 'Wajib')?.default_amount || 0;
          const loanInstallment = member.has_active_loan ? member.loan_installment : 0;
          const total = pokok + wajib + loanInstallment;
          
          totalPokok += pokok;
          totalWajib += wajib;
          totalLoan += loanInstallment;
          
          return {
            id: member.id,
            name: member.name,
            nip: member.nip,
            unit: member.unit,
            pokok: pokok,
            wajib: wajib,
            sukarela: 0,
            loan_installment: loanInstallment,
            total: total
          };
        });
        
        setDeductions(deductionData);
        setSummary({
          total_pokok: totalPokok,
          total_wajib: totalWajib,
          total_sukarela: 0,
          total_loan: totalLoan,
          total_all: totalPokok + totalWajib + totalLoan
        });
      }
    } catch (error: any) {
      console.error('Error fetching deductions:', error);
      addNotification({
        title: 'Error',
        message: error.response?.data?.message || 'Gagal mengambil data potongan',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  }, [axiosInstance, addNotification, selectedMonth]);

  useEffect(() => {
    fetchDeductions();
  }, [fetchDeductions, selectedMonth]);

  const filteredDeductions = deductions.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.nip.includes(searchTerm)
  );

  const handleExportExcelFormat = async () => {
    setIsLoading(true);
    try {
      const monthName = new Date(selectedMonth + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      const transactionDate = selectedMonth.replace('-', '') + '01';
      
      let csvContent = [];
      
      // Header utama
      csvContent.push(['REKENINGKREDIT', 'NAMA REKENING', 'REMARKS', 'JUMLAH AMOUNT', 'JUMLAH CHARGE', 'JUMLAH RECORD', 'TANGGAL', 'CABANG', 'CORPORATE/CUSTOMER', 'CORPORATE CHARGE']);
      csvContent.push([
        '9203902930293',
        'REKENING PENAMPUNGAN',
        'POT INSTANSI',
        summary.total_all.toString(),
        '0',
        deductions.length.toString(),
        '',
        '0020',
        '',
        ''
      ]);
      csvContent.push([]);
      csvContent.push(['REKENINGDEBET', 'NAMA REKENING', 'REMARKS', 'AMOUNT', 'CHARGE', '', '', '', '', '']);
      
      // Data per anggota - CHARGE 1000 per orang
      filteredDeductions.forEach((item) => {
        const totalPotongan = item.pokok + item.wajib + item.loan_installment;
        if (totalPotongan > 0) {
          csvContent.push([
            '182032093029',
            item.name,
            'POTONGAN BULANAN',
            totalPotongan.toString(),
            '1000',
            '1',
            transactionDate,
            '0020',
            '',
            ''
          ]);
        }
      });
      
      const csvString = csvContent.map(row => row.join(',')).join('\n');
      const blob = new Blob(["\uFEFF" + csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `potongan_bank_${selectedMonth}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      addNotification({
        title: 'Berhasil',
        message: `File format bank untuk bulan ${monthName} berhasil diekspor`,
        type: 'success'
      });
    } catch (error: any) {
      addNotification({
        title: 'Gagal',
        message: 'Gagal mengekspor data',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ekspor Potongan Bulanan</h1>
          <p className="text-gray-500 dark:text-gray-400">Generate data potongan iuran wajib, pokok, dan angsuran pinjaman untuk bendahara gaji.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchDeductions}
            className="p-3 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-500 hover:text-imigrasi-primary transition-colors"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={handleExportExcelFormat}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20 disabled:opacity-70"
          >
            {isLoading ? <RefreshCw className="animate-spin" size={18} /> : <Download size={18} />}
            Ekspor Format Bank
          </button>
        </div>
      </div>

      {/* Month Selector & Search */}
      <div className="glass-card p-6 rounded-[2.5rem] space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Pilih Bulan</label>
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
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Cari Anggota</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Cari nama atau NIP..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent focus:border-imigrasi-accent rounded-2xl outline-none transition-all dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <p className="text-sm opacity-80">💰 Total Pokok</p>
          <p className="text-xl font-bold">{formatCurrency(summary.total_pokok)}</p>
        </div>
        <div className="glass-card p-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
          <p className="text-sm opacity-80">💵 Total Wajib</p>
          <p className="text-xl font-bold">{formatCurrency(summary.total_wajib)}</p>
        </div>
        <div className="glass-card p-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-white">
          <p className="text-sm opacity-80">🏦 Total Angsuran</p>
          <p className="text-xl font-bold">{formatCurrency(summary.total_loan)}</p>
        </div>
        <div className="glass-card p-4 rounded-2xl bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <p className="text-sm opacity-80">📊 Total Keseluruhan</p>
          <p className="text-xl font-bold">{formatCurrency(summary.total_all)}</p>
        </div>
      </div>

      {/* Deductions Table */}
      <div className="glass-card rounded-[2.5rem] overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-neutral-700 flex items-center justify-between">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white">Daftar Potongan - {new Date(selectedMonth + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</h3>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
            <CheckCircle2 size={14} />
            Data Siap Ekspor
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-neutral-800/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-bold">Anggota</th>
                <th className="px-6 py-4 font-bold">NIP</th>
                <th className="px-6 py-4 font-bold">Unit</th>
                <th className="px-6 py-4 font-bold text-right">Iuran Pokok</th>
                <th className="px-6 py-4 font-bold text-right">Iuran Wajib</th>
                <th className="px-6 py-4 font-bold text-right">Angsuran Pinjaman</th>
                <th className="px-6 py-4 font-bold text-right">Total Potongan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-700">
              {filteredDeductions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    Tidak ada data potongan
                  </td>
                </tr>
              ) : (
                filteredDeductions.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-neutral-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-gray-400" />
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{item.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-600 dark:text-gray-300">{item.nip}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{item.unit}</td>
                    <td className="px-6 py-4 text-sm text-right text-gray-700 dark:text-gray-300">{formatCurrency(item.pokok)}</td>
                    <td className="px-6 py-4 text-sm text-right text-gray-700 dark:text-gray-300">{formatCurrency(item.wajib)}</td>
                    <td className="px-6 py-4 text-sm text-right text-amber-600 dark:text-amber-400">{formatCurrency(item.loan_installment)}</td>
                    <td className="px-6 py-4 text-sm text-right font-bold text-imigrasi-primary dark:text-white">{formatCurrency(item.total)}</td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 dark:bg-neutral-800/50 font-bold">
                <td colSpan={3} className="px-6 py-4 text-sm text-gray-900 dark:text-white">TOTAL KESELURUHAN</td>
                <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-white">{formatCurrency(summary.total_pokok)}</td>
                <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-white">{formatCurrency(summary.total_wajib)}</td>
                <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-white">{formatCurrency(summary.total_loan)}</td>
                <td className="px-6 py-4 text-sm text-right text-imigrasi-primary dark:text-white">{formatCurrency(summary.total_all)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Info Box */}
      <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-[2rem] border border-blue-100 dark:border-blue-900/30 flex items-start gap-4">
        <div className="p-3 bg-blue-500 text-white rounded-2xl shadow-lg shadow-blue-500/20">
          <ArrowUpRight size={24} />
        </div>
        <div>
          <h4 className="font-bold text-blue-900 dark:text-blue-400">Instruksi Ekspor</h4>
          <p className="text-sm text-blue-800 dark:text-blue-500/80 mt-1 leading-relaxed">
            Data ini digunakan untuk pemotongan gaji otomatis setiap bulan.
            <strong className="block mt-2">Format Bank:</strong> Menghasilkan file CSV dengan format standar perbankan (REKENINGKREDIT dan REKENINGDEBET). Charge per transaksi: Rp 1.000.
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default DeductionExport;