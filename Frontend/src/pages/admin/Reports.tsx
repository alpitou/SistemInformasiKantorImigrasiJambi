import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  FileText, Download, PieChart, TrendingUp, Calendar, Filter,
  FileSpreadsheet, FileCheck, RefreshCw, Share2, MessageCircle,
  Info, Wallet, HandCoins, ShoppingBag, ArrowUpRight, ArrowDownRight,
  Printer, Mail, Loader2, AlertCircle, CheckCircle2, XCircle, Users,
  Banknote, Landmark
} from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import api from '../../services/api';

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
  verification_status?: string;
  payment_method?: string;
  installment_number?: number;
  saving_type?: string;
}

interface FinancialSummary {
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

interface KantinIncome {
  id: number;
  income_date: string;
  description: string;
  amount: number;
  shu_amount: number;
  payment_method: string;
}

interface SavingData {
  id: number;
  user_id: number;
  saving_type_id: number;
  amount: number;
  transaction_type: string;
  description: string;
  transaction_date: string;
  verification_status: string;
  user?: {
    id: number;
    name: string;
  };
  type?: {
    id: number;
    name: string;
  };
}

interface LoanData {
  id: number;
  user_id: number;
  amount: number;
  status: string;
  purpose: string;
  created_at: string;
  user?: {
    id: number;
    name: string;
  };
}

interface InstallmentData {
  id: number;
  loan_id: number;
  installment_number: number;
  amount_paid: number;
  payment_method: string;
  payment_date: string;
  loan?: {
    id: number;
    user_id: number;
    purpose: string;
    user?: {
      id: number;
      name: string;
    };
  };
}

interface ReportSummary {
  total_income: number;
  total_savings_deposit: number;
  total_savings_withdrawal: number;
  total_loans_application: number;
  total_installments: number;
  total_kantin: number;
  transaction_count: number;
  member_count: number;
  active_loan_count: number;
}

const ReportsPage: React.FC = () => {
  const { addNotification } = useNotifications();
  const [isExporting, setIsExporting] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary>({
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
  const [reportType, setReportType] = useState<'all' | 'savings' | 'loans' | 'installments' | 'kantin'>('all');

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

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMonthName = (monthString: string) => {
    if (!monthString) return '-';
    const [year, month] = monthString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  };

  // Fetch all data from multiple endpoints
  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const allTransactions: Transaction[] = [];

      // ========== 1. FETCH SAVINGS DATA (Deposits and Withdrawals) ==========
      try {
        const savingsResponse = await api.get('/savings');
        if (savingsResponse.data.success && savingsResponse.data.data) {
          const savings = savingsResponse.data.data;

          savings.forEach((saving: SavingData) => {
            // ONLY include verified transactions - SKIP PENDING
            if (saving.verification_status !== 'verified') return;

            const transactionDate = saving.transaction_date;
            const transactionMonth = transactionDate ? transactionDate.slice(0, 7) : '';

            // Filter by selected month
            if (selectedMonth && transactionMonth !== selectedMonth) return;

            const isDeposit = saving.transaction_type === 'deposit';
            const savingTypeName = saving.type?.name || 'Simpanan';
            const isPayroll = saving.description?.toLowerCase().includes('gaji') ||
              saving.description?.toLowerCase().includes('payroll');

            let title = '';
            let type = '';
            let isIncome = true;

            if (isDeposit) {
              if (isPayroll) {
                title = `Potongan Payroll (${savingTypeName})`;
                type = 'payroll';
              } else {
                title = `Setoran ${savingTypeName}`;
                type = 'saving';
              }
              isIncome = true;
            } else {
              title = `Penarikan ${savingTypeName}`;
              type = 'withdrawal';
              isIncome = false;
            }

            allTransactions.push({
              id: `saving_${saving.id}`,
              original_id: saving.id,
              type: type,
              category: savingTypeName,
              title: title,
              description: saving.description || (isDeposit ? 'Setoran simpanan' : 'Penarikan simpanan'),
              amount: saving.amount,
              date: transactionDate,
              user: saving.user?.name || 'System',
              status: 'success',
              is_income: isIncome,
              verification_status: 'verified',
              saving_type: savingTypeName
            });
          });
        }
      } catch (error) {
        console.warn('Failed to fetch savings:', error);
      }

      // ========== 2. FETCH FINANCIAL SUMMARY ==========
      try {
        const summaryResponse = await api.get('/savings/financial/summary');
        if (summaryResponse.data.success) {
          setFinancialSummary(summaryResponse.data.data);
        }
      } catch (error) {
        console.warn('Failed to fetch financial summary:', error);
      }

      // ========== 3. FETCH KANTIN INCOMES ==========
      try {
        const kantinResponse = await api.get('/savings/kantin/incomes', {
          params: { month: selectedMonth }
        });

        if (kantinResponse.data.success && kantinResponse.data.data) {
          const kantinList = kantinResponse.data.data;
          kantinList.forEach((kantin: KantinIncome) => {
            allTransactions.push({
              id: `kantin_${kantin.id}`,
              original_id: kantin.id,
              type: 'kantin',
              category: 'Kantin',
              title: 'Pemasukan Kantin',
              description: kantin.description,
              amount: kantin.amount,
              date: kantin.income_date,
              user: 'Kantin',
              status: 'success',
              is_income: true,
              verification_status: 'verified',
              payment_method: kantin.payment_method
            });
          });
        }
      } catch (error) {
        console.warn('Failed to fetch kantin incomes:', error);
      }

      // ========== 4. FETCH LOAN INSTALLMENTS (Angsuran Pinjaman) ==========
      try {
        // Get all loans
        const loansResponse = await api.get('/loans');
        if (loansResponse.data.success && loansResponse.data.data) {
          const loans = loansResponse.data.data.data || loansResponse.data.data;
          if (Array.isArray(loans)) {
            for (const loan of loans) {
              try {
                const installmentsResponse = await api.get(`/loans/${loan.id}/installments`);
                if (installmentsResponse.data.success && installmentsResponse.data.data) {
                  const installments = installmentsResponse.data.data;
                  if (Array.isArray(installments)) {
                    installments.forEach((installment: InstallmentData) => {
                      const installmentDate = installment.payment_date;
                      const installmentMonth = installmentDate ? installmentDate.slice(0, 7) : '';

                      if (selectedMonth && installmentMonth !== selectedMonth) return;

                      allTransactions.push({
                        id: `installment_${installment.id}`,
                        original_id: installment.id,
                        type: 'loan_installment',
                        category: 'Pinjaman',
                        title: `Angsuran Pinjaman Ke-${installment.installment_number}`,
                        description: `Pembayaran angsuran - ${loan.purpose || 'Pinjaman'}`,
                        amount: installment.amount_paid,
                        date: installmentDate,
                        user: loan.user?.name || 'System',
                        status: 'success',
                        is_income: true,
                        verification_status: 'verified',
                        payment_method: installment.payment_method,
                        installment_number: installment.installment_number
                      });
                    });
                  }
                }
              } catch (error) {
                console.warn(`Failed to fetch installments for loan ${loan.id}:`, error);
              }
            }
          }
        }
      } catch (error) {
        console.warn('Failed to fetch loan installments:', error);
      }

      // Sort by date (newest first)
      allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setTransactions(allTransactions);

      // ========== CALCULATE SUMMARY ==========
      let totalIncome = 0;
      let totalSavingsDeposit = 0;
      let totalSavingsWithdrawal = 0;
      let totalLoansApplication = 0;
      let totalInstallments = 0;
      let totalKantin = 0;

      allTransactions.forEach((t) => {
        // Total income (money coming in)
        if (t.is_income) {
          totalIncome += t.amount;
        }

        // Categorize for display
        if (t.type === 'saving' || t.type === 'payroll') {
          totalSavingsDeposit += t.amount;
        } else if (t.type === 'withdrawal') {
          totalSavingsWithdrawal += t.amount;
        } else if (t.type === 'loan_application') {
          totalLoansApplication += t.amount;
        } else if (t.type === 'loan_installment') {
          totalInstallments += t.amount;
        } else if (t.type === 'kantin') {
          totalKantin += t.amount;
        }
      });

      setReportSummary({
        total_income: totalIncome,
        total_savings_deposit: totalSavingsDeposit,
        total_savings_withdrawal: totalSavingsWithdrawal,
        total_loans_application: totalLoansApplication,
        total_installments: totalInstallments,
        total_kantin: totalKantin,
        transaction_count: allTransactions.length,
        member_count: financialSummary.total_members,
        active_loan_count: financialSummary.active_loans_count
      });

    } catch (error: any) {
      console.error('Failed to fetch data:', error);
      addNotification({
        title: 'Error',
        message: error.response?.data?.message || 'Gagal mengambil data laporan',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth, addNotification, financialSummary.total_members, financialSummary.active_loans_count]);

  const [reportSummary, setReportSummary] = useState<ReportSummary>({
    total_income: 0,
    total_savings_deposit: 0,
    total_savings_withdrawal: 0,
    total_loans_application: 0,
    total_installments: 0,
    total_kantin: 0,
    transaction_count: 0,
    member_count: 0,
    active_loan_count: 0
  });

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData, selectedMonth]);

  const getFilteredTransactions = () => {
    let filtered = [];

    if (reportType === 'all') {
      filtered = [...transactions];
    } else if (reportType === 'savings') {
      filtered = transactions.filter(t => t.type === 'saving' || t.type === 'payroll' || t.type === 'withdrawal');
    } else if (reportType === 'loans') {
      filtered = transactions.filter(t => t.type === 'loan_application');
    } else if (reportType === 'installments') {
      filtered = transactions.filter(t => t.type === 'loan_installment');
    } else if (reportType === 'kantin') {
      filtered = transactions.filter(t => t.type === 'kantin');
    } else {
      filtered = [...transactions];
    }

    return filtered;
  };

  const filteredTransactions = getFilteredTransactions();

  const filteredTotal = filteredTransactions.reduce((sum, t) => {
    const amount = typeof t.amount === 'number' ? t.amount : Number(t.amount) || 0;
    return sum + amount;
  }, 0);

  const handleExportCSV = async () => {
    if (transactions.length === 0) {
      addNotification({
        title: 'Tidak Ada Data',
        message: 'Tidak ada data transaksi untuk periode ini',
        type: 'warning'
      });
      return;
    }

    setIsExporting(true);
    try {
      const monthName = getMonthName(selectedMonth);
      const reportDate = new Date().toLocaleDateString('id-ID');

      let csvContent = [];

      // Header
      csvContent.push(['LAPORAN KEUANGAN KOPERASI KANIM JAMBI']);
      csvContent.push([`Periode: ${monthName}`]);
      csvContent.push([`Tanggal Cetak: ${reportDate}`]);
      csvContent.push([]);

      // Summary
      csvContent.push(['RINGKASAN LAPORAN']);
      csvContent.push(['Total Pendapatan', formatCurrency(reportSummary.total_income)]);
      csvContent.push(['Total Setoran Simpanan', formatCurrency(reportSummary.total_savings_deposit)]);
      csvContent.push(['Total Penarikan Simpanan', formatCurrency(reportSummary.total_savings_withdrawal)]);
      csvContent.push(['Total Angsuran Pinjaman', formatCurrency(reportSummary.total_installments)]);
      csvContent.push(['Total Pemasukan Kantin', formatCurrency(reportSummary.total_kantin)]);
      csvContent.push(['Jumlah Transaksi', reportSummary.transaction_count.toString()]);
      csvContent.push(['Jumlah Anggota', reportSummary.member_count.toString()]);
      csvContent.push(['Pinjaman Aktif', reportSummary.active_loan_count.toString()]);
      csvContent.push([]);

      // Details header
      csvContent.push(['DETAIL TRANSAKSI']);
      csvContent.push(['No', 'Tanggal', 'Jenis Transaksi', 'Kategori', 'Deskripsi', 'Jumlah (Rp)']);

      // Data rows
      let no = 1;
      filteredTransactions.forEach((t) => {
        let jenisTransaksi = '';
        if (t.type === 'saving') jenisTransaksi = 'Setoran Sukarela';
        else if (t.type === 'payroll') jenisTransaksi = 'Potongan Payroll';
        else if (t.type === 'loan_application') jenisTransaksi = 'Pengajuan Pinjaman';
        else if (t.type === 'loan_installment') jenisTransaksi = 'Angsuran Pinjaman';
        else if (t.type === 'kantin') jenisTransaksi = 'Pemasukan Kantin';
        else if (t.type === 'withdrawal') jenisTransaksi = 'Penarikan Simpanan';
        else jenisTransaksi = t.title;

        csvContent.push([
          no.toString(),
          formatDate(t.date),
          jenisTransaksi,
          t.category || '-',
          t.description || '-',
          t.payment_method === 'cash' ? 'Tunai' : t.payment_method === 'transfer' ? 'Transfer' : t.payment_method === 'potong_gaji' ? 'Potong Gaji' : '-',
          t.amount.toString()
        ]);
        no++;
      });

      csvContent.push([]);
      csvContent.push(['TOTAL KESELURUHAN', '', '', '', '', '', formatCurrency(filteredTotal)]);

      // Generate CSV
      const csvString = csvContent.map(row => row.join(',')).join('\n');
      const blob = new Blob(["\uFEFF" + csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `laporan_keuangan_${selectedMonth}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      addNotification({
        title: 'Berhasil',
        message: `Laporan keuangan bulan ${monthName} berhasil diekspor`,
        type: 'success'
      });
    } catch (error: any) {
      console.error('Export error:', error);
      addNotification({
        title: 'Gagal',
        message: error.message || 'Gagal mengekspor laporan',
        type: 'error'
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    if (transactions.length === 0) {
      addNotification({
        title: 'Tidak Ada Data',
        message: 'Tidak ada data transaksi untuk periode ini',
        type: 'warning'
      });
      return;
    }

    setIsExporting(true);
    try {
      const monthName = getMonthName(selectedMonth);
      const reportDate = new Date().toLocaleDateString('id-ID');
      const userName = localStorage.getItem('user') ?
        JSON.parse(localStorage.getItem('user') || '{}').name : 'System';

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        addNotification({
          title: 'Pop-up Terblokir',
          message: 'Mohon izinkan pop-up untuk mencetak laporan',
          type: 'error'
        });
        setIsExporting(false);
        return;
      }

      const tableRows = filteredTransactions.map((t, index) => {
        let jenisTransaksi = '';
        if (t.type === 'saving') jenisTransaksi = 'Setoran Sukarela';
        else if (t.type === 'payroll') jenisTransaksi = 'Potongan Payroll';
        else if (t.type === 'loan_application') jenisTransaksi = 'Pengajuan Pinjaman';
        else if (t.type === 'loan_installment') jenisTransaksi = t.installment_number ? `Angsuran Pinjaman Ke-${t.installment_number}` : 'Angsuran Pinjaman';
        else if (t.type === 'kantin') jenisTransaksi = 'Pemasukan Kantin';
        else if (t.type === 'withdrawal') jenisTransaksi = 'Penarikan Simpanan';
        else jenisTransaksi = t.title;

        return `
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${index + 1}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${formatDate(t.date)}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${jenisTransaksi}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${t.description || '-'}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${formatCurrency(t.amount)}</td>
          </tr>
        `;
      }).join('');

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Laporan Keuangan Koperasi Kanim Jambi - ${monthName}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Segoe UI', Arial, sans-serif;
              margin: 20px;
              padding: 20px;
              background: white;
            }
            .report-container { max-width: 1200px; margin: 0 auto; }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 3px solid #1a56db;
            }
            .header h1 { color: #1a56db; margin-bottom: 8px; font-size: 24px; }
            .header h3 { color: #374151; margin-bottom: 5px; font-size: 18px; }
            .header p { color: #6b7280; font-size: 12px; }
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 15px;
              margin-bottom: 30px;
            }
            .summary-card {
              background: #f3f4f6;
              padding: 15px;
              border-radius: 8px;
              text-align: center;
              border: 1px solid #e5e7eb;
            }
            .summary-card h4 { font-size: 12px; color: #6b7280; margin-bottom: 8px; }
            .summary-card p { font-size: 18px; font-weight: bold; color: #1a56db; }
            .section-title {
              font-size: 16px;
              font-weight: bold;
              color: #374151;
              margin: 20px 0 15px 0;
              padding-bottom: 8px;
              border-bottom: 2px solid #e5e7eb;
            }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th {
              background: #1a56db;
              color: white;
              padding: 10px 8px;
              text-align: left;
              font-weight: bold;
            }
            th:last-child { text-align: right; }
            td { padding: 8px; border: 1px solid #e5e7eb; }
            td:last-child { text-align: right; }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              text-align: center;
              font-size: 10px;
              color: #9ca3af;
            }
            .signature {
              margin-top: 40px;
              display: flex;
              justify-content: space-between;
            }
            .signature-box { text-align: center; width: 200px; }
            .signature-line {
              margin-top: 40px;
              border-top: 1px solid #000;
              width: 100%;
            }
            @media print {
              body { margin: 0; padding: 0; }
              th { background: #1a56db !important; color: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .summary-card { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="report-container">
            <div class="header">
              <h1>KOPERASI KANIM JAMBI</h1>
              <h3>LAPORAN KEUANGAN</h3>
              <p>Periode: ${monthName}</p>
              <p>Tanggal Cetak: ${reportDate}</p>
            </div>
            
            <div class="summary-grid">
              <div class="summary-card">
                <h4>TOTAL PENDAPATAN</h4>
                <p>${formatCurrency(reportSummary.total_income)}</p>
              </div>
              <div class="summary-card">
                <h4>SETORAN SIMPANAN</h4>
                <p>${formatCurrency(reportSummary.total_savings_deposit)}</p>
              </div>
              <div class="summary-card">
                <h4>ANGSURAN PINJAMAN</h4>
                <p>${formatCurrency(reportSummary.total_installments)}</p>
              </div>
              <div class="summary-card">
                <h4>PEMASUKAN KANTIN</h4>
                <p>${formatCurrency(reportSummary.total_kantin)}</p>
              </div>
            </div>
            
            <div class="summary-grid">
              <div class="summary-card">
                <h4>PENARIKAN SIMPANAN</h4>
                <p>${formatCurrency(reportSummary.total_savings_withdrawal)}</p>
              </div>
              <div class="summary-card">
                <h4>JUMLAH TRANSAKSI</h4>
                <p>${reportSummary.transaction_count}</p>
              </div>
              <div class="summary-card">
                <h4>JUMLAH ANGGOTA</h4>
                <p>${reportSummary.member_count}</p>
              </div>
              <div class="summary-card">
                <h4>PINJAMAN AKTIF</h4>
                <p>${reportSummary.active_loan_count}</p>
              </div>
            </div>
            
            <div class="section-title">DETAIL TRANSAKSI</div>
            
            <table>
              <thead>
                <tr>
                  <th style="width: 40px;">No</th>
                  <th>Tanggal</th>
                  <th>Jenis Transaksi</th>
                  <th>Deskripsi</th>
                  <th style="text-align: right;">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
              <tfoot>
                <tr style="background: #f3f4f6; font-weight: bold;">
                  <td colspan="4" style="text-align: right;">TOTAL</td>
                  <td style="text-align: right;">${formatCurrency(filteredTotal)}</td>
                </tr>
              </tfoot>
            </table>
            
            <div class="signature">
              <div class="signature-box">
                <div class="signature-line"></div>
                <p>Mengetahui,<br>Ketua Koperasi</p>
              </div>
              <div class="signature-box">
                <div class="signature-line"></div>
                <p>Mengetahui,<br>Bendahara</p>
              </div>
              <div class="signature-box">
                <div class="signature-line"></div>
                <p>Dicetak oleh,<br>${userName}</p>
              </div>
            </div>
            
            <div class="footer">
              <p>Laporan ini dihasilkan secara otomatis dari Sistem Informasi Koperasi (SIMKOP-IM)</p>
              <p>© ${new Date().getFullYear()} Koperasi Kanim Jambi - All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `);

      printWindow.document.close();
      printWindow.print();

      addNotification({
        title: 'Berhasil',
        message: `Laporan keuangan bulan ${monthName} siap dicetak`,
        type: 'success'
      });
    } catch (error: any) {
      console.error('PDF export error:', error);
      addNotification({
        title: 'Gagal',
        message: error.message || 'Gagal mengekspor ke PDF',
        type: 'error'
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'saving':
        return <Wallet size={16} className="text-green-600" />;
      case 'payroll':
        return <TrendingUp size={16} className="text-blue-600" />;
      case 'loan_application':
        return <HandCoins size={16} className="text-purple-600" />;
      case 'loan_installment':
        return <Banknote size={16} className="text-amber-600" />;
      case 'kantin':
        return <ShoppingBag size={16} className="text-pink-600" />;
      case 'withdrawal':
        return <ArrowDownRight size={16} className="text-red-600" />;
      default:
        return <FileText size={16} className="text-gray-600" />;
    }
  };

  const getTransactionBgColor = (type: string) => {
    switch (type) {
      case 'saving':
        return 'bg-green-100 dark:bg-green-900/20';
      case 'payroll':
        return 'bg-blue-100 dark:bg-blue-900/20';
      case 'loan_application':
        return 'bg-purple-100 dark:bg-purple-900/20';
      case 'loan_installment':
        return 'bg-amber-100 dark:bg-amber-900/20';
      case 'kantin':
        return 'bg-pink-100 dark:bg-pink-900/20';
      case 'withdrawal':
        return 'bg-red-100 dark:bg-red-900/20';
      default:
        return 'bg-gray-100 dark:bg-gray-900/20';
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText size={24} className="text-imigrasi-primary" />
            Laporan Keuangan
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Laporan lengkap setoran simpanan, penarikan, pinjaman, angsuran, dan pemasukan kantin
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchAllData}
            disabled={isLoading}
            className="p-3 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-500 hover:text-imigrasi-primary transition-colors disabled:opacity-50"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-1">
              <Calendar size={12} /> Periode Laporan
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 rounded-lg focus:border-imigrasi-primary outline-none transition-all dark:text-white text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-1">
              <Filter size={12} /> Tipe Laporan
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 rounded-lg focus:border-imigrasi-primary outline-none dark:text-white text-sm"
            >
              <option value="all">Semua Transaksi</option>
              <option value="savings">Setoran & Penarikan Simpanan</option>
              <option value="installments">Angsuran Pinjaman</option>
              <option value="kantin">Pemasukan Kantin</option>
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={handleExportCSV}
              disabled={isExporting || transactions.length === 0 || isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {isExporting ? <Loader2 size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />}
              Ekspor CSV
            </button>
            <button
              onClick={handleExportPDF}
              disabled={isExporting || transactions.length === 0 || isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-800 transition-colors disabled:opacity-50"
            >
              {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
              Ekspor PDF
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards - 4 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-imigrasi-primary from-blue-500 to-blue-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs opacity-80">Total Pendapatan</p>
              <p className="text-2xl font-bold">{formatCurrency(reportSummary.total_income)}</p>
            </div>
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Wallet size={20} />
            </div>
          </div>
        </div>

        <div className="bg-imigrasi-primary from-emerald-500 to-emerald-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs opacity-80">Setoran Simpanan</p>
              <p className="text-2xl font-bold">{formatCurrency(reportSummary.total_savings_deposit)}</p>
            </div>
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
          </div>
        </div>

        <div className="bg-imigrasi-primary from-amber-500 to-amber-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs opacity-80">Angsuran Pinjaman</p>
              <p className="text-2xl font-bold">{formatCurrency(reportSummary.total_installments)}</p>
            </div>
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Banknote size={20} />
            </div>
          </div>
        </div>

        <div className="bg-imigrasi-primary from-purple-500 to-purple-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs opacity-80">Pemasukan Kantin</p>
              <p className="text-2xl font-bold">{formatCurrency(reportSummary.total_kantin)}</p>
            </div>
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <ShoppingBag size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Stats - Additional Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 p-4">
          <h3 className="font-bold text-gray-700 dark:text-gray-300 text-sm mb-3 flex items-center gap-2">
            <ArrowDownRight size={14} className="text-red-500" />
            Penarikan & Pengajuan
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Penarikan Simpanan</span>
              <span className="font-bold text-red-600">{formatCurrency(reportSummary.total_savings_withdrawal)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Jumlah Transaksi</span>
              <span className="font-bold text-imigrasi-primary">{reportSummary.transaction_count}</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 p-4">
          <h3 className="font-bold text-gray-700 dark:text-gray-300 text-sm mb-3 flex items-center gap-2">
            <Users size={14} className="text-blue-500" />
            Data Anggota
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Anggota</span>
              <span className="font-bold text-blue-600">{reportSummary.member_count}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Pinjaman Aktif</span>
              <span className="font-bold text-amber-600">{reportSummary.active_loan_count}</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 p-4">
          <h3 className="font-bold text-gray-700 dark:text-gray-300 text-sm mb-3 flex items-center gap-2">
            <Calendar size={14} className="text-imigrasi-primary" />
            Informasi Periode
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Bulan Laporan</span>
              <span className="font-bold text-imigrasi-primary">{getMonthName(selectedMonth)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Tanggal Cetak</span>
              <span className="font-bold">{formatDateTime(new Date().toISOString())}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History Table */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-neutral-700 flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-bold text-gray-900 dark:text-white">
            Riwayat Transaksi - {getMonthName(selectedMonth)}
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">
              {filteredTransactions.length} transaksi
            </span>
            <span className="text-xs font-bold text-emerald-600">
              Total: {formatCurrency(filteredTotal)}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          {isLoading ? (
            <div className="p-12 text-center">
              <Loader2 className="animate-spin mx-auto text-imigrasi-primary" size={32} />
              <p className="mt-4 text-gray-500">Memuat data transaksi...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 dark:bg-neutral-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText size={40} className="text-gray-400" />
              </div>
              <p className="text-gray-500">Belum ada transaksi terverifikasi untuk periode {getMonthName(selectedMonth)}</p>
              <p className="text-xs text-gray-400 mt-1">Silakan pilih periode lain atau tunggu transaksi diverifikasi</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="p-12 text-center">
              <Filter size={40} className="mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500">Tidak ada transaksi untuk filter yang dipilih</p>
              <button
                onClick={() => setReportType('all')}
                className="mt-3 px-4 py-2 text-sm bg-imigrasi-primary text-white rounded-lg"
              >
                Reset Filter
              </button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-neutral-800/50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">No</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Tanggal</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Jenis</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Deskripsi</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">Jumlah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-neutral-700">
                {filteredTransactions.map((transaction, index) => {
                  let jenisTransaksi = '';
                  if (transaction.type === 'saving') jenisTransaksi = 'Setoran Sukarela';
                  else if (transaction.type === 'payroll') jenisTransaksi = 'Potongan Payroll';
                  else if (transaction.type === 'loan_installment') jenisTransaksi = `Angsuran Pinjaman${transaction.installment_number ? ` Ke-${transaction.installment_number}` : ''}`;
                  else if (transaction.type === 'kantin') jenisTransaksi = 'Pemasukan Kantin';
                  else if (transaction.type === 'withdrawal') jenisTransaksi = 'Penarikan Simpanan';
                  else jenisTransaksi = transaction.title;

                  return (
                    <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-neutral-700/30 transition-colors">
                      <td className="px-4 py-3 text-gray-500 text-xs">{index + 1}</td>
                      <td className="px-4 py-3">
                        <span className="text-gray-700 dark:text-gray-300 text-xs">
                          {formatDate(transaction.date)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${getTransactionBgColor(transaction.type)}`}>
                            {getTransactionIcon(transaction.type)}
                          </div>
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            {jenisTransaksi}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {transaction.description || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {transaction.payment_method && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${transaction.payment_method === 'cash' ? 'bg-green-100 text-green-700' :
                            transaction.payment_method === 'transfer' ? 'bg-blue-100 text-blue-700' :
                              transaction.payment_method === 'potong_gaji' ? 'bg-purple-100 text-purple-700' :
                                'bg-gray-100 text-gray-700'
                            }`}>
                            {transaction.payment_method === 'cash' ? 'Tunai' :
                              transaction.payment_method === 'transfer' ? 'Transfer' :
                                transaction.payment_method === 'potong_gaji' ? 'Potong Gaji' : '-'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-xs font-bold ${transaction.type === 'withdrawal' ? 'text-red-600' : 'text-emerald-600'
                          }`}>
                          {transaction.type === 'withdrawal' ? '-' : '+'}{formatCurrency(transaction.amount)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50 dark:bg-neutral-800/50">
                <tr>
                  <td colSpan={5} className="px-4 py-3 text-right font-bold text-gray-700 dark:text-gray-300">
                    TOTAL KESELURUHAN
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(filteredTotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="p-5 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30 flex gap-3">
        <div className="p-2 bg-white dark:bg-neutral-800 rounded-lg text-imigrasi-primary shadow-sm">
          <Info size={20} />
        </div>
        <div>
          <h4 className="font-bold text-blue-900 dark:text-blue-400 text-sm">Informasi Laporan</h4>
          <p className="text-xs text-blue-800 dark:text-blue-500/80 leading-relaxed mt-1">
            Laporan keuangan mencakup seluruh transaksi yang tercatat di sistem meliputi:
            <strong> Setoran Simpanan</strong> (wajib, pokok, sukarela),
            <strong> Penarikan Simpanan</strong>,
            <strong> Angsuran Pinjaman</strong>, dan
            <strong> Pemasukan Kantin</strong>.
            <br />
            <span className="text-green-600">✓ Hanya transaksi dengan status TERVERIFIKASI yang ditampilkan dalam laporan.</span>
            <span className="text-blue-600"> Gunakan filter untuk melihat jenis transaksi tertentu. Ekspor ke CSV untuk analisis lebih lanjut atau cetak PDF untuk arsip.</span>
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default ReportsPage;